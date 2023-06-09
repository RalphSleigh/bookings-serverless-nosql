resource "aws_dynamodb_table" "bookings_table" {
  name           = "Bookings"
  billing_mode   = "PROVISIONED"
  read_capacity  = 20
  write_capacity = 20
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
    name               = "ls1"
    projection_type    = "ALL"
    range_key          = "userIdVersion"
  }
}