terraform {
  backend "s3" {
    bucket = "terraform-remote-state"
    key    = "web-app-template/terraform-local.tfstate"
    region = "auto"

    // R2のための設定
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}

variable "app_origin" {
  type    = string
  default = "http://web-app-template.localhost:5173"
}

module "auth0" {
  source                    = "../../modules/auth0"
  auth0_callback            = "${var.app_origin}/api/auth/callback"
  auth0_app_name            = "web-app-template-local"
  auth0_resource_identifier = var.app_origin
  auth0_logout_url          = var.app_origin
  auth0_web_origin          = var.app_origin
}

module "update_environment" {
  source                  = "../../modules/update_env"
  mode                    = "development"
  app_origin              = var.app_origin
  auth0_app_client_id     = module.auth0.auth0_app_client_id
  auth0_app_client_secret = module.auth0.auth0_app_client_secret
}
