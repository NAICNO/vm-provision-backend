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
  type    = list(string)
}
