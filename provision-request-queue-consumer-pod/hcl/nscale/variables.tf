# Provider configuration variables
variable "nscale_organization_id" {
  description = "The nscale organization ID (set via TF_VAR_nscale_organization_id env var)"
  type        = string
}

variable "nscale_project_id" {
  description = "The nscale project ID (set via TF_VAR_nscale_project_id env var)"
  type        = string
}

variable "nscale_service_token" {
  description = "The nscale service token for authentication"
  type        = string
  sensitive   = true
}

# Region configuration
variable "region_id" {
  description = "Region ID where the VM will be deployed"
  type        = string
}

# Standard VM variables (consistent with other providers)
variable "vm_id" {
  description = "Unique identifier for the VM"
  type        = string
}

variable "vm_name" {
  description = "Name for the VM"
  type        = string
}

variable "public_key" {
  description = "SSH public key for VM access"
  type        = string
}

variable "image_name" {
  description = "The image name to use for the VM"
  type        = string
}

variable "flavor_name" {
  description = "The flavor name for the VM"
  type        = string
}


# Security configuration
variable "allow_ssh_from_v4" {
  description = "List of IPv4 CIDR blocks allowed to SSH to the VM"
  type        = list(string)
  default     = []
}

# Cloud-init callback URLs - kept for future implementation
variable "init_boot_call_url" {
  description = "URL to call when VM boot starts"
  type        = string
  default     = ""
}

variable "phone_home_url" {
  description = "URL for cloud-init phone home callback"
  type        = string
  default     = ""
}

# Optional Jupyter configuration
variable "username" {
  description = "Username for Jupyter configuration"
  type        = string
  default     = ""
}

variable "jupyter_token" {
  description = "Token for Jupyter notebook"
  type        = string
  default     = ""
}

variable "jupyter_init_start_url" {
  description = "URL to call when Jupyter init starts"
  type        = string
  default     = ""
}

variable "jupyter_init_complete_url" {
  description = "URL to call when Jupyter init completes"
  type        = string
  default     = ""
}
