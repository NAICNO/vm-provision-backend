# Variables
variable "project_id" {
  default = "vm-provisioning"
}

variable "region" {
  default = "europe-west1"
}

variable "zone" {
  default = "europe-west1-b"
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
  type    = list(string)
}
