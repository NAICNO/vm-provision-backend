# Variables
variable "project_id" {
  default = "usit-itf-naic-project"
}

variable "region" {
  default = "europe-north1"
}

variable "zone" {
  default = "europe-north1-a"
}

variable "disk_size" {
  default = 20
}

variable "vm_id" {}

variable "vm_name" {}

variable "public_key" {}

variable "image_name" {}

variable "flavor_name" {}

# Security group defaults
variable "allow_ssh_from_v4" {
  type = list(string)
}

variable "init_boot_call_url" {
  type = string
}

variable "phone_home_url" {
  type = string
}

variable "username" {
  type    = string
  default = ""
}

variable "jupyter_token" {
  type    = string
  default = ""
}

variable "jupyter_init_start_url" {
  type    = string
  default = ""
}

variable "jupyter_init_complete_url" {
  type    = string
  default = ""
}
