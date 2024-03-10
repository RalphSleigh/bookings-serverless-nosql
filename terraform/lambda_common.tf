resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "lambda_exec_role_policy" {
  statement {
    actions = [
      "sqs:SendMessage"
    ]
    resources = [aws_sqs_queue.email_queue.arn, aws_sqs_queue.drive_sync_queue.arn]
  }

  statement {
    actions = ["sns:Publish"]
    resources = [aws_sns_topic.lambda-errors.arn]
  }

  statement {
    actions = [
      "dynamodb:DeleteItem",
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:GetRecords",
      "dynamodb:ListTables",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:UpdateItem",
      "dynamodb:UpdateTable",
    ]

    resources = [aws_dynamodb_table.bookings_table.arn, "${aws_dynamodb_table.bookings_table.arn}/index/*", aws_dynamodb_table.config_table.arn]

    effect = "Allow"
  }
}

resource "aws_iam_policy" "lambda_execution_policy" {
  name   = "lambda_execution_policy"
  path   = "/"
  policy = data.aws_iam_policy_document.lambda_exec_role_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.iam_for_lambda.id
  policy_arn = aws_iam_policy.lambda_execution_policy.arn
}

resource "aws_iam_role_policy_attachment" "iam_role_policy_attachment_lambda_vpc_access_execution" {
  role       = aws_iam_role.iam_for_lambda.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}
