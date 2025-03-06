# Variables
variable "region" {
  default = "osl"
}

variable "vm_id" {}

variable "vm_name" {}

variable "public_key" {}

variable "image_name" {}

variable "flavor_name" {}

# Security group defaults
variable "allow_ssh_from_v4" {
  type    = list(string)
}

variable "init_boot_call_url" {
  type = string
}

variable "phone_home_url" {
  type = string
}
