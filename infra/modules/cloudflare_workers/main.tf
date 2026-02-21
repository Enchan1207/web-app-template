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

variable "worker_name" {
  type = string
}

resource "cloudflare_worker" "worker" {
  account_id = var.cloudflare_account_id
  name       = var.worker_name
  observability = {
    enabled = true
  }
  subdomain = {
    enabled          = false
    previews_enabled = false
  }
}
