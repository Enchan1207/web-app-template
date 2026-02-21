variable "mode" {
  type = string
}

variable "database_id" {
  type = string
}

variable "database_name" {
  type = string
}

data "external" "merge_environment" {
  program = [
    "pnpm",
    "--silent",
    "-F",
    "infra-scripts",
    "update-wrangler",
    "--mode",
    var.mode
  ]
  query = {
    database_id   = var.database_id
    database_name = var.database_name
  }
}
