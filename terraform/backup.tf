
resource "aws_backup_vault" "bookings_backup_vault" {
  name        = "bookings-backup-vault"
}

resource "aws_backup_vault_lock_configuration" "test" {
  backup_vault_name   = aws_backup_vault.bookings_backup_vault.name
  max_retention_days  = 1200
  min_retention_days  = 29
}

data "aws_iam_policy_document" "backup_trust_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["backup.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "backup_role" {
  name               = "backup-role"
  assume_role_policy = data.aws_iam_policy_document.backup_trust_policy.json
}

resource "aws_iam_role_policy_attachment" "backup_role_polict_attachment" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
  role       = aws_iam_role.backup_role.name
}

resource "aws_backup_plan" "bookings_backup_plan" {
  name = "bookings_backup_plan"

  rule {
    rule_name         = "bookings_backup_rule"
    target_vault_name = aws_backup_vault.bookings_backup_vault.name
    schedule          = "cron(0 03 * * ? *)"

    lifecycle {
      delete_after = 30
    }
  }
}

resource "aws_backup_selection" "bookings_backup_selection" {
  iam_role_arn = aws_iam_role.backup_role.arn
  name         = "booking_backup_selection"
  plan_id      = aws_backup_plan.bookings_backup_plan.id

  resources = [
    aws_dynamodb_table.bookings_table.arn
  ]
}