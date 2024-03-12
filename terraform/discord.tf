resource "aws_sqs_queue" "discord_queue" {
  name                       = "discord-queue"
  visibility_timeout_seconds = 300
}

data "archive_file" "discord_lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../dist-lambda/lambdas/discord/discord.mjs"
  output_path = "${path.module}/files/discord-lambda.zip"
}

resource "aws_s3_object" "discord_lambda_code" {
  bucket = aws_s3_bucket.lambda_code.id
  key    = data.archive_file.discord_lambda_zip.output_md5
  source = data.archive_file.discord_lambda_zip.output_path
}

resource "aws_cloudwatch_log_group" "discord_lambda_log_group" {
  name              = "/aws/lambda/function_discord"
  retention_in_days = 14
}

resource "aws_lambda_function" "discord_lambda" {
  function_name = "function_discord"
  role          = aws_iam_role.discord_lambda_role.arn
  handler       = "discord.lambdaHandler"

  s3_bucket = aws_s3_bucket.lambda_code.id
  s3_key    = resource.aws_s3_object.discord_lambda_code.key

  architectures = ["arm64"]
  memory_size   = 256
  timeout       = 60

  layers = [resource.aws_lambda_layer_version.node_modules_layer.arn]

  environment {
    variables = {
      workspace = terraform.workspace
      log_arm   = resource.aws_cloudwatch_log_stream.booking_system_logs.arn
      DISCORD_QUEUE_URL = aws_sqs_queue.discord_queue.id
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment,
  ]

  runtime = "nodejs18.x"
}

resource "aws_lambda_event_source_mapping" "event_source_mapping_discord" {
  event_source_arn = aws_sqs_queue.discord_queue.arn
  enabled          = true
  function_name    = aws_lambda_function.discord_lambda.arn
  batch_size       = 1
}

data "aws_iam_policy_document" "discord_lambda_role_iam_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "discord_lambda_role" {
  name               = "DiscordLambdaRole"
  assume_role_policy = data.aws_iam_policy_document.discord_lambda_role_iam_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_sqs_role_policy_discord" {
  role       = aws_iam_role.discord_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

resource "aws_iam_role_policy_attachment" "discord_standard_lambda_policy_attachment" {
  role       = aws_iam_role.discord_lambda_role.name
  policy_arn = aws_iam_policy.lambda_execution_policy.arn
}