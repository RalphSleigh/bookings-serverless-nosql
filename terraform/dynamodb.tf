resource "aws_dynamodb_table" "bookings_table" {
  name           = "Bookings"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "pk"
  range_key      = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "userIdVersion"
    type = "S"
  }

  local_secondary_index {
    name            = "ls1"
    projection_type = "ALL"
    range_key       = "userIdVersion"
  }
}
/* 
resource "aws_appautoscaling_target" "bookings_table_read_target" {
  min_capacity       = var.dyanmodb_read_min_capacity
  max_capacity       = var.dynamodb_read_max_capacity
  resource_id        = "table/${aws_dynamodb_table.bookings_table.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "bookings_table_read_policy" {
  name               = "DynamoDBReadCapacityUtilization:${aws_appautoscaling_target.bookings_table_read_target.resource_id}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.bookings_table_read_target.resource_id
  scalable_dimension = aws_appautoscaling_target.bookings_table_read_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.bookings_table_read_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }

    target_value = 70
  }
}

resource "aws_appautoscaling_target" "bookings_table_write_target" {
  min_capacity       = var.dynamodb_write_min_capacity
  max_capacity       = var.dynamodb_write_max_capacity
  resource_id        = "table/${aws_dynamodb_table.bookings_table.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "bookings_table_write_policy" {
  name               = "DynamoDBReadCapacityUtilization:${aws_appautoscaling_target.bookings_table_write_target.resource_id}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.bookings_table_write_target.resource_id
  scalable_dimension = aws_appautoscaling_target.bookings_table_write_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.bookings_table_write_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }

    target_value = 70
  }
} */

resource "aws_dynamodb_table" "config_table" {
  name           = "Config"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 1
  hash_key       = "pk"
  range_key      = "key"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "key"
    type = "S"
  }

  lifecycle {
    ignore_changes = [
      read_capacity,
      write_capacity,
    ]
  }
}

resource "aws_appautoscaling_target" "config_table_read_target" {
  max_capacity       = 5
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.config_table.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "config_table_read_policy" {
  name               = "DynamoDBReadCapacityUtilization:${aws_appautoscaling_target.config_table_read_target.resource_id}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.config_table_read_target.resource_id
  scalable_dimension = aws_appautoscaling_target.config_table_read_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.config_table_read_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }

    target_value = 70
  }
}

resource "aws_appautoscaling_target" "config_table_write_target" {
  max_capacity       = 1
  min_capacity       = 1
  resource_id        = "table/${aws_dynamodb_table.config_table.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "config_table_write_policy" {
  name               = "DynamoDBReadCapacityUtilization:${aws_appautoscaling_target.config_table_write_target.resource_id}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.config_table_write_target.resource_id
  scalable_dimension = aws_appautoscaling_target.config_table_write_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.config_table_write_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }

    target_value = 70
  }
}
