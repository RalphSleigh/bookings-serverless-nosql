variable "dynamodb_read_default_capacity" {
  description = "The default read capacity for the DynamoDB table"
  default     = 15
  type = number
}

variable "dynamodb_write_default_capacity" {
  description = "The default write capacity for the DynamoDB table"
  default     = 15
  type = number
}

variable "dyanmodb_read_min_capacity" {
  description = "The minimum read capacity for the DynamoDB table"
  default     = 15
  type = number
}

variable "dynamodb_read_max_capacity" {
  description = "The maximum read capacity for the DynamoDB table"
  default     = 50
  type = number
}

variable "dynamodb_write_min_capacity" {
  description = "The minimum write capacity for the DynamoDB table"
  default     = 15
  type = number
}

variable "dynamodb_write_max_capacity" {
  description = "The maximum write capacity for the DynamoDB table"
  default     = 20
  type = number
}