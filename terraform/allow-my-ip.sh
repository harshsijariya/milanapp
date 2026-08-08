#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Point the SSH rule at wherever you are right now.
#
#   cd terraform && ./allow-my-ip.sh
#
# Home broadband hands out a new address every few days, and the security group
# allows exactly one /32. When it changes, SSH stops answering - it times out
# rather than refusing, which reads like the server is down. That has already
# cost an afternoon on this project.
#
# Goes through Terraform rather than calling the EC2 API directly, on purpose.
# Editing the security group by hand works for about ten seconds and then
# terraform.tfvars disagrees with reality, so the next `terraform apply` quietly
# locks you out again by putting the old address back. Updating the variable and
# applying keeps one source of truth.
#
#   --direct   skip Terraform and change the group immediately. For when you are
#              locked out and in a hurry; re-run without it afterwards so state
#              catches up.
#   --dry-run  print what would change and stop.
# ---------------------------------------------------------------------------

set -euo pipefail

cd "$(dirname "$0")"

TFVARS="terraform.tfvars"
TARGET="aws_vpc_security_group_ingress_rule.app_ssh"

DIRECT=false
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --direct)  DIRECT=true ;;
    --dry-run) DRY_RUN=true ;;
    -h|--help) sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $arg (try --help)" >&2; exit 2 ;;
  esac
done

# --- what is my address ----------------------------------------------------
#
# AWS's own endpoint, with a second opinion behind it. These services do go
# down, and a script that silently writes an empty CIDR would remove your only
# way in.

fetch_ip() {
  local ip
  for url in https://checkip.amazonaws.com https://api.ipify.org https://ifconfig.me/ip; do
    ip=$(curl -fsS --max-time 10 "$url" 2>/dev/null | tr -d '[:space:]') || continue
    # Validate rather than trust: a captive portal or an error page returns 200
    # with HTML, and that would sail straight into the security group.
    if [[ $ip =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
      echo "$ip"
      return 0
    fi
  done
  return 1
}

if ! MY_IP=$(fetch_ip); then
  echo "Could not determine your public IP address." >&2
  echo "Every lookup service failed or returned something that was not an IPv4 address." >&2
  exit 1
fi

NEW_CIDR="${MY_IP}/32"
CURRENT_CIDR=$(grep -E '^\s*ssh_allowed_cidr' "$TFVARS" 2>/dev/null | sed -E 's/.*"(.*)".*/\1/' || true)

echo "your address : $MY_IP"
echo "allowed now  : ${CURRENT_CIDR:-<not set>}"

if [[ "$CURRENT_CIDR" == "$NEW_CIDR" ]]; then
  echo
  echo "Already correct - nothing to do."
  # Not an error. This script is meant to be run reflexively before SSH, so the
  # common case is that nothing has changed.
  exit 0
fi

if [[ "$DRY_RUN" == true ]]; then
  echo
  echo "Would change ssh_allowed_cidr to $NEW_CIDR"
  exit 0
fi

# --- direct mode -----------------------------------------------------------

if [[ "$DIRECT" == true ]]; then
  echo
  echo "Direct mode: changing the security group without Terraform."

  SG_ID=$(terraform output -raw app_security_group_id 2>/dev/null || true)
  if [[ -z "$SG_ID" ]]; then
    # No such output declared, so fall back to finding it by name.
    SG_ID=$(aws ec2 describe-security-groups \
      --filters "Name=group-name,Values=gahoi-milan-prod-app" \
      --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || true)
  fi

  if [[ -z "$SG_ID" || "$SG_ID" == "None" ]]; then
    echo "Could not find the security group. Run without --direct." >&2
    exit 1
  fi

  # Revoke every existing port-22 rule before adding the new one. Adding
  # without revoking leaves the old address allowed, and after a few weeks the
  # group is a list of cafes you once worked from.
  OLD_RULES=$(aws ec2 describe-security-group-rules \
    --filters "Name=group-id,Values=$SG_ID" \
    --query "SecurityGroupRules[?FromPort==\`22\`&&IsEgress==\`false\`].SecurityGroupRuleId" \
    --output text)

  if [[ -n "$OLD_RULES" && "$OLD_RULES" != "None" ]]; then
    # shellcheck disable=SC2086
    aws ec2 revoke-security-group-ingress \
      --group-id "$SG_ID" \
      --security-group-rule-ids $OLD_RULES >/dev/null
    echo "  revoked $(wc -w <<< "$OLD_RULES" | tr -d ' ') old rule(s)"
  fi

  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --ip-permissions "IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=$NEW_CIDR,Description='SSH from the operator only'}]" \
    >/dev/null

  echo "  allowed $NEW_CIDR on $SG_ID"
  echo
  echo "Terraform now disagrees with reality. Re-run this script without"
  echo "--direct when you have a moment, or the next apply will put the old"
  echo "address back and lock you out again."
  exit 0
fi

# --- terraform mode --------------------------------------------------------

if ! command -v terraform >/dev/null; then
  echo "terraform is not installed. Use --direct, or install it." >&2
  exit 1
fi

echo
if [[ -n "$CURRENT_CIDR" ]]; then
  # -i '' is the BSD/macOS form. GNU sed wants -i with no argument, so this is
  # written to work on both rather than assuming a mac.
  sed -i.bak -E "s|^([[:space:]]*ssh_allowed_cidr[[:space:]]*=[[:space:]]*).*|\1\"$NEW_CIDR\"|" "$TFVARS"
  rm -f "${TFVARS}.bak"
else
  printf '\nssh_allowed_cidr = "%s"\n' "$NEW_CIDR" >> "$TFVARS"
fi
echo "updated $TFVARS -> $NEW_CIDR"

# -target is normally a smell, but it is right here: this script exists to
# change one rule, and a full apply would sweep up unrelated drift that has not
# been reviewed. State on this project has drifted before.
terraform apply -target="$TARGET" -auto-approve

echo
echo "Done. SSH should answer now:"
echo "  ssh -i ~/.ssh/gahoi-milan.pem ubuntu@\$(terraform output -raw api_public_ip 2>/dev/null || echo '<host>')"
echo
echo "Commit the terraform.tfvars change so the next person's apply does not"
echo "revert it."
