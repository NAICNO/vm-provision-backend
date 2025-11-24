terraform {
  required_providers {
    ibm = {
      source = "IBM-Cloud/ibm"
      version = ">= 1.12.0"
    }
  }
}

provider "ibm" {
  region           = "eu-de"
  zone             = "eu-de-1"
}

locals {
  instance_catalog = {
    # tweak these to your needs
    "power11.small" = {
      vcpu        = 1
      memory_gb   = 2
      pi_sys_type = "s1122"
    }
    "power11.medium" = {
      vcpu        = 2
      memory_gb   = 4
      proc_type   = "shared"
      pi_sys_type = "s1122"
    }
    "power11.large" = {
      vcpu        = 4
      memory_gb   = 16
      pi_sys_type = "s1122"
    }

    "power10.small" = {
      vcpu        = 1
      memory_gb   = 2
      pi_sys_type = "s1022"
    }
    "power10.medium" = {
      vcpu        = 2
      memory_gb   = 4
      pi_sys_type = "s1022"
    }
    "power10.large" = {
      vcpu        = 4
      memory_gb   = 16
      pi_sys_type = "s1022"
    }
  }

  # pick the selected shape (null if invalid key)
  selected = lookup(local.instance_catalog, var.flavor_name, null)
}

data "ibm_pi_public_network" "public_network" {
  pi_cloud_instance_id = var.cloud_instance_id
}

# Using CentOS 9 image for the instance
data "ibm_pi_image" "os_image" {
  pi_cloud_instance_id = var.cloud_instance_id
  pi_image_name        = var.image_name
}

# Create an SSH key resource
resource "ibm_pi_key" "public_sshkey" {
  pi_key_name          = "${var.vm_id}-sshkey"
  pi_ssh_key           = var.public_key
  pi_cloud_instance_id = var.cloud_instance_id
}

# Create a Power Virtual Server instance
resource "ibm_pi_instance" "vm" {
  pi_memory            = local.selected.memory_gb
  pi_processors        = local.selected.vcpu
  pi_sys_type          = local.selected.pi_sys_type
  pi_proc_type         = "shared"
  pi_instance_name     = var.vm_id
  pi_image_id          = data.ibm_pi_image.os_image.id
  pi_key_pair_name     = ibm_pi_key.public_sshkey.name
  pi_cloud_instance_id = var.cloud_instance_id
  pi_pin_policy        = "none"
  pi_health_status     = "WARNING"

  pi_network {
    network_id = data.ibm_pi_public_network.public_network.id
  }
  pi_user_data = templatefile("${path.module}/cloud-init-ibm.yaml", {
    phone_home_url = var.phone_home_url
    init_boot_call_url = var.init_boot_call_url
  })
}

output "vm_ip" {
  value = ibm_pi_instance.vm.pi_network[0].external_ip
}

output "vm_provision_status" {
  value = "PROVISIONING_COMPLETED"
  depends_on = [ibm_pi_instance.vm]
}

