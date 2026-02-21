terraform {
  backend "s3" {
    bucket = "terraform-remote-state"
    key    = "web-app-template/terraform-prod.tfstate"
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

// Will be injected via ENV vars
variable "cloudflare_account_id" {
  type = string
}

variable "mode" {
  type    = string
  default = "production"
}

variable "app_origin" {
  type    = string
  default = "https://web-app-template.example.com"
}

module "cloudflare_workers" {
  source                = "../../modules/cloudflare_workers"
  cloudflare_account_id = var.cloudflare_account_id
  worker_name           = "web-app-template-prod"
}

module "auth0" {
  source                    = "../../modules/auth0"
  auth0_callback            = "${var.app_origin}/api/auth/callback"
  auth0_app_name            = "web-app-template-prod"
  auth0_resource_identifier = var.app_origin
  auth0_logout_url          = var.app_origin
  auth0_web_origin          = var.app_origin
}

module "d1_database" {
  source                = "../../modules/cloudflare_d1"
  cloudflare_account_id = var.cloudflare_account_id
  database_name         = "web-app-template-prod"
}

module "update_environment" {
  source                  = "../../modules/update_env"
  mode                    = var.mode
  app_origin              = var.app_origin
  auth0_app_client_id     = module.auth0.auth0_app_client_id
  auth0_app_client_secret = module.auth0.auth0_app_client_secret
}

module "update_wrangler" {
  source        = "../../modules/update_wrangler"
  mode          = var.mode
  database_id   = module.d1_database.d1_database_id
  database_name = module.d1_database.d1_database_name
}
