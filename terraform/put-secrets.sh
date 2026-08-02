#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Fill in the Secrets Manager secret from your local secrets file.
#
#   cd terraform && ./put-secrets.sh
#
# Terraform creates the secret and seeds the values it knows (database URL,
# username, bucket). This puts in the ones it does not: the generated JWT and
# admin secrets, plus mail and Google credentials you supply interactively.
#
# Run it again any time to update - it reads the current secret, merges your
# changes over the top, and writes a new version. Previous versions stay
# available in the console for rollback.
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")"

SECRET_ID="${1:-$(terraform output -raw secret_id 2>/dev/null || echo gahoi-milan/prod)}"
REGION="${AWS_REGION:-ap-south-1}"
LOCAL_SECRETS="$HOME/.gahoi-milan-secrets.txt"

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  \033[32mok\033[0m   %s\n" "$1"; }
warn() { printf "  \033[33m!\033[0m    %s\n" "$1"; }

bold "Updating $SECRET_ID in $REGION"

if ! aws secretsmanager describe-secret --secret-id "$SECRET_ID" --region "$REGION" >/dev/null 2>&1; then
  printf "  \033[31mfail\033[0m Secret '%s' does not exist in %s.\n\n" "$SECRET_ID" "$REGION" >&2
  echo "  Terraform creates it. Run this first:" >&2
  echo "      terraform apply" >&2
  echo >&2
  echo "  Then re-run this script." >&2
  exit 1
fi

# Start from what is already stored, so a re-run never drops a key someone
# added by hand in the console.
CURRENT=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ID" --region "$REGION" \
  --query SecretString --output text 2>/dev/null || echo '{}')

read_local() {
  [[ -f "$LOCAL_SECRETS" ]] || return 0
  grep "^$1=" "$LOCAL_SECRETS" 2>/dev/null | tail -1 | cut -d= -f2- || true
}

JWT=$(read_local JWT_SECRET)
ADMIN=$(read_local NOTIFICATIONS_ADMIN_SECRET)
DB_PASS=$(read_local DB_PASSWORD)

[[ -n "$JWT"     ]] && ok "JWT_SECRET from $LOCAL_SECRETS"
[[ -n "$ADMIN"   ]] && ok "NOTIFICATIONS_ADMIN_SECRET from $LOCAL_SECRETS"
[[ -n "$DB_PASS" ]] && ok "DB_PASSWORD from $LOCAL_SECRETS"

echo
bold "Values Terraform cannot know - press Enter to keep the current value"

# -r stops backslashes being eaten; -s hides the password as it is typed.
read -r -p "  Gmail address            : " MAIL_USER
read -r -s -p "  Gmail App Password       : " MAIL_PASS; echo
read -r -p "  Google OAuth client IDs   : " GOOGLE_IDS
read -r -p "  Enable Firebase push (y/N): " FIREBASE

FIREBASE_ENABLED=""
[[ "$FIREBASE" =~ ^[Yy]$ ]] && FIREBASE_ENABLED="true"

# Merge in python rather than jq: python3 ships with macOS, jq does not.
UPDATED=$(CURRENT="$CURRENT" \
  JWT="$JWT" ADMIN="$ADMIN" DB_PASS="$DB_PASS" \
  MAIL_USER="$MAIL_USER" MAIL_PASS="$MAIL_PASS" \
  GOOGLE_IDS="$GOOGLE_IDS" FIREBASE_ENABLED="$FIREBASE_ENABLED" \
  python3 -c '
import json, os
secret = json.loads(os.environ["CURRENT"] or "{}")

# Empty input means "leave it as it is", so a re-run to change one value does
# not blank the other seven.
for key, env in [
    ("JWT_SECRET", "JWT"),
    ("NOTIFICATIONS_ADMIN_SECRET", "ADMIN"),
    ("DB_PASSWORD", "DB_PASS"),
    ("MAIL_USERNAME", "MAIL_USER"),
    ("MAIL_PASSWORD", "MAIL_PASS"),
    ("GOOGLE_OAUTH_CLIENT_IDS", "GOOGLE_IDS"),
    ("FIREBASE_ENABLED", "FIREBASE_ENABLED"),
]:
    value = os.environ.get(env, "")
    if value:
        secret[key] = value

print(json.dumps(secret, indent=2, sort_keys=True))
')

echo
bold "Keys that will be stored"
echo "$UPDATED" | python3 -c '
import json, sys
for k, v in sorted(json.load(sys.stdin).items()):
    # Never print a value. Length alone is enough to spot an empty one.
    print(f"  {k:32} {len(v)} chars" if v else f"  {k:32} \033[33mEMPTY\033[0m")'

echo
read -r -p "Write this version? [y/N] " CONFIRM
[[ "$CONFIRM" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }

aws secretsmanager put-secret-value \
  --secret-id "$SECRET_ID" \
  --region "$REGION" \
  --secret-string "$UPDATED" \
  --query 'VersionId' --output text

echo
ok "stored"
warn "restart the app to pick it up:"
echo "     aws ssm send-command --instance-ids \$(terraform output -raw api_instance_id) \\"
echo "       --document-name AWS-RunShellScript \\"
echo "       --parameters commands='systemctl restart gahoi-milan'"
