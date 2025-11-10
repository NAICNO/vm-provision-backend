# Define required providers
terraform {
  required_version = ">= 1.0"
  required_providers {
    nscale = {
      source  = "nscaledev/nscale"
      version = "0.0.2"
    }
  }
}

# Configure the nscale Provider
provider "nscale" {
  endpoint        = "https://compute.nks.europe-west4.nscale.com"
  organization_id = var.nscale_organization_id
  project_id      = var.nscale_project_id
  service_token   = var.nscale_service_token
}

# Create compute cluster (VM)
resource "nscale_compute_cluster" "vm" {
  name      = "${var.vm_name}-${var.vm_id}"
  region_id = var.region_id

  workload_pools = [
    {
      flavor_id        = local.flavor_catalog[var.flavor_name].id
      image_id         = local.image_catalog[var.image_name].id
      name             = "default"
      replicas         = 1
      enable_public_ip = true
      firewall_rules = [
        {
          direction = "ingress"
          ports     = "22"
          prefixes  = var.allow_ssh_from_v4
          protocol  = "tcp"
        }
      ]
      user_data = base64encode(templatefile("${path.module}/cloud-init-nscale.yaml", {
        public_key = var.public_key
        init_boot_call_url = var.init_boot_call_url
        phone_home_url = var.phone_home_url
        username = var.username
      }))
    }
  ]
}

# Output the IP address of the VM
output "vm_ip" {
  value = nscale_compute_cluster.vm.workload_pools[0].machines[0].public_ip
}

output "vm_provision_status" {
  value      = "PROVISIONING_COMPLETED"
  depends_on = [nscale_compute_cluster.vm]
}

