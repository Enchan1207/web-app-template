variable "mode" {
  type = string
}

variable "app_origin" {
  type = string
}

variable "auth0_app_client_id" {
  type = string
}

variable "auth0_app_client_secret" {
  type = string
}

data "external" "merge_environment" {
  program = [
    "pnpm",
    "--silent",
    "-F",
    "infra-scripts",
    "update-env",
    "--mode",
    var.mode,
    "--file-suffix",
    ".local"
  ]

  query = {
    APP_ORIGIN              = var.app_origin
    AUTH0_APP_CLIENT_ID     = var.auth0_app_client_id
    AUTH0_APP_CLIENT_SECRET = var.auth0_app_client_secret
  }
}
