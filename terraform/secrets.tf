# ---------------------------------------------------------------------------
# AWS Secrets Manager
#
# One secret holding every production value as flat JSON. The keys are the same
# names application-prod.properties already interpolates, so the properties
# file needs no changes - ${DB_PASSWORD} resolves from this instead of from an
# environment variable.
#
# Cost: $0.40/secret/month plus $0.05 per 10,000 API calls. The app reads it
# once at startup, so the call charge is effectively zero. One secret rather
# than eight is a deliberate choice: eight would be $3.20/month for no benefit.
#
# SSM Parameter Store would be free for values this size. Secrets Manager buys
# automatic rotation, cross-account sharing and versioned rollback - none of
# which this app uses yet, but 40 cents is a reasonable price for not having to
# migrate later.
# ---------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "app" {
  name        = "${var.project}/${var.environment}"
  description = "Runtime configuration for the Gahoi Milan API"

  # Deleting a secret has a mandatory waiting period. 7 days is the minimum
  # that still lets you undo an accidental destroy.
  recovery_window_in_days = 7

  tags = { Name = "${local.name}-secrets" }
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id

  secret_string = jsonencode({
    # --- Database. Terraform already knows these. ---
    DB_URL      = local.db_url
    DB_USERNAME = var.db_username
    DB_PASSWORD = var.db_password

    # --- Application secrets ---
    JWT_SECRET                 = var.jwt_secret
    NOTIFICATIONS_ADMIN_SECRET = var.notifications_admin_secret

    # --- S3. Keys stay empty: the instance role supplies credentials. ---
    AWS_S3_BUCKET = var.s3_photo_bucket

    # --- Mail ---
    MAIL_USERNAME = var.mail_username
    MAIL_PASSWORD = var.mail_password

    # --- Google sign-in. Public identifiers, but kept together for one
    #     source of truth rather than split across two places. ---
    GOOGLE_OAUTH_CLIENT_IDS = var.google_oauth_client_ids
    API_BASE_URL            = "https://${var.api_domain}"

    # --- Push notifications ---
    FIREBASE_SERVICE_ACCOUNT_PATH = "/etc/gahoi-milan/firebase-service-account.json"
    FIREBASE_ENABLED              = tostring(var.firebase_enabled)

    CORS_ALLOWED_ORIGINS = var.cors_allowed_origins
  })

  lifecycle {
    # Values edited by hand in the console must survive the next apply.
    # Terraform is how the secret is created, not how it is maintained -
    # rotating a password should not require a code change.
    ignore_changes = [secret_string]
  }
}

# Read access for the application. Scoped to this one secret: a broader grant
# would let a compromised app read every secret in the account.
resource "aws_iam_role_policy" "app_secrets" {
  name = "${local.name}-read-secrets"
  role = aws_iam_role.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
      Resource = aws_secretsmanager_secret.app.arn
    }]
  })
}

output "secret_id" {
  description = "Secret name the app reads at startup."
  value       = aws_secretsmanager_secret.app.name
}

output "secret_console_url" {
  value = "https://${var.region}.console.aws.amazon.com/secretsmanager/secret?name=${aws_secretsmanager_secret.app.name}&region=${var.region}"
}
