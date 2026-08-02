# Deploying Gahoi Milan

Everything below assumes `cd "/Users/harshsijariya/Downloads/marriage-app-main 2"`.

Your infrastructure is already created. What remains is: put the secrets in,
load the database, point DNS, get a certificate, deploy, build the APK.

| | |
|---|---|
| API server | `15.206.227.60` (`i-0b4ff76ecea727577`) |
| Database | `gahoi-milan-prod-db.chi6ik84i9qr.ap-south-1.rds.amazonaws.com` |
| Domain | `api.gahoimarriage.in` |
| Secret | `gahoi-milan/prod` |

---

## 1. Put the secrets in

```bash
cd terraform
./put-secrets.sh
```

It reads the generated JWT and admin secrets from `~/.gahoi-milan-secrets.txt`
and prompts for the rest. Have ready:

- **Gmail address** and an **App Password** from
  [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
  (not your account password)
- **Google OAuth client IDs** — copy from `frontend/.env`,
  `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`,
  comma-separated

Confirm it landed:

```bash
aws secretsmanager get-secret-value --secret-id gahoi-milan/prod \
  --region ap-south-1 --query SecretString --output text | python3 -m json.tool
```

---

## 2. Load the database

RDS is private, so this runs from the EC2 box.

```bash
scp -i ~/.ssh/gahoi-milan.pem \
  Dump20260725.sql \
  backend/gahoi-milan-api-feature-h-sijariya/src/main/resources/db/*.sql \
  ubuntu@15.206.227.60:~

ssh -i ~/.ssh/gahoi-milan.pem ubuntu@15.206.227.60
```

On the server — schema first, then migrations, in this order:

```bash
DB=gahoi-milan-prod-db.chi6ik84i9qr.ap-south-1.rds.amazonaws.com

mysql -h $DB -u admin -p < Dump20260725.sql
mysql -h $DB -u admin -p marriage_portal < reference_data.sql
mysql -h $DB -u admin -p marriage_portal < created_at.sql
mysql -h $DB -u admin -p marriage_portal < notifications.sql
```

Password is `DB_PASSWORD` in `~/.gahoi-milan-secrets.txt`.

The app runs `ddl-auto=validate`, so it **refuses to start** if the tables do
not match the entities. A startup failure here is almost always a migration
that was not run.

---

## 3. Point DNS

GoDaddy → **My Products → gahoimarriage.in → DNS → Add New Record**

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `api` | `15.206.227.60` | 600 |

Wait for it:

```bash
dig +short api.gahoimarriage.in
```

It must print `15.206.227.60` before the next step. Let's Encrypt allows only
**5 failures per hostname per hour**, and a premature attempt burns one.

---

## 4. Certificate

```bash
ssh -i ~/.ssh/gahoi-milan.pem ubuntu@15.206.227.60

sudo cp nginx-gahoi-milan.conf /etc/nginx/sites-available/gahoi-milan
sudo ln -sf /etc/nginx/sites-available/gahoi-milan /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo certbot --nginx -d api.gahoimarriage.in
sudo nginx -t && sudo systemctl reload nginx
```

Renewal is automatic. Confirm the timer exists:

```bash
systemctl list-timers | grep certbot
```

---

## 5. Deploy the backend

**Actions → Deploy backend → Run workflow** on GitHub, or:

```bash
git push origin main
```

The workflow builds the jar, runs the tests, uploads to S3, installs it over
SSM and waits for `/actuator/health`. If health fails it puts the previous jar
back and prints the last 60 log lines into the Actions output.

Verify from anywhere:

```bash
curl https://api.gahoimarriage.in/actuator/health
# {"status":"UP"}
```

---

## 6. Build the APK

```bash
cd frontend
npm install -g eas-cli
eas login
eas build:configure

eas build --platform android --profile production-apk
```

10–20 minutes. It prints a download link.

`eas.json` already points at `https://api.gahoimarriage.in`. `EXPO_PUBLIC_*`
values are baked in at build time, so changing the URL later needs a rebuild.

**Back up the signing keystore immediately:**

```bash
eas credentials
```

→ Android → production → Download keystore. Lose it and you can never publish
an update to that app on Play Store — a different keystore is a different app,
and existing users cannot upgrade.

---

## Day-to-day

```bash
# Logs
ssh -i ~/.ssh/gahoi-milan.pem ubuntu@15.206.227.60
sudo journalctl -u gahoi-milan -f

# Restart without SSH
aws ssm send-command --instance-ids i-0b4ff76ecea727577 \
  --document-name AWS-RunShellScript \
  --parameters commands='systemctl restart gahoi-milan'

# Change a secret: edit in the console, then restart as above
```

Deploying again is just a push to `main` touching `backend/**`.

---

## Before real users

- [ ] **Rotate the AWS key `AKIA6GGH…`** — public in commit `c4b62b4`. Deactivate
      it in IAM; the instance role has replaced it
- [ ] **Budget alert at $5** — Billing → Budgets. AWS sends no warning when free
      usage ends
- [ ] Test signup, login, Google sign-in, photo upload, connect, notifications
- [ ] `CORS_ALLOWED_ORIGINS` is `*` — fine for the Android app, wrong the moment
      a web build exists

---

## When something breaks

| Symptom | Cause |
|---|---|
| App will not start | Missing migration (`ddl-auto=validate`), or a blank value in the secret. `journalctl -u gahoi-milan -n 100` |
| `Could not read secret` | Instance role lost `secretsmanager:GetSecretValue`, or `SECRET_ID` is wrong in `/etc/gahoi-milan/gahoi-milan.env` |
| 502 from nginx | Java is not listening. `systemctl status gahoi-milan` |
| App cannot reach API | `eas.json` had the wrong URL at build time — rebuild |
| Deploy stuck at Pending | SSM agent. `aws ssm describe-instance-information` |
| Connection refused to RDS | Security group needs the EC2 group as source, not an IP |

---

## Reference

- [`terraform/README.md`](terraform/README.md) — infrastructure, costs, design decisions
- Secrets: one JSON blob in `gahoi-milan/prod`, read at startup by
  `SecretsManagerEnvironmentPostProcessor` using the instance role
- Local development is unaffected: no prod profile means no AWS call, and
  `application.properties` is used as before
