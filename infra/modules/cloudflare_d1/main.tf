terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.12.0"
    }
  }
}

variable "cloudflare_account_id" {
  type = string
}

variable "database_name" {
  type = string
}

resource "cloudflare_d1_database" "database" {
  account_id = var.cloudflare_account_id
  name       = var.database_name
  read_replication = {
    mode = "auto"
  }
}

output "d1_database_id" {
  value = cloudflare_d1_database.database.id
}

output "d1_database_name" {
  value = cloudflare_d1_database.database.name
}
