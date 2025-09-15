# Define required providers
terraform {
  required_version = ">= 1.0"
  required_providers {
    openstack = {
      source  = "terraform-provider-openstack/openstack"
    }
  }
}

# Configure the OpenStack Provider
# Empty means using environment variables "OS_*". More info:
# https://registry.terraform.io/providers/terraform-provider-openstack/openstack/latest/docs
provider "openstack" {
  auth_url    = "https://api.nrec.no:5000/v3"
  user_domain_name = "dataporten"
  project_domain_name = "dataporten"
  region = var.region
}

# SSH key
resource "openstack_compute_keypair_v2" "keypair" {
  region     = var.region
  name       = "${var.vm_name}-${var.vm_id}-kp"
  public_key = var.public_key
}

resource "openstack_compute_instance_v2" "vm" {
  region      = var.region
  name        = "${var.vm_name}-${var.vm_id}"
  image_name  = var.image_name
  flavor_name = var.flavor_name

  key_pair = openstack_compute_keypair_v2.keypair.name
  security_groups = [
    "default",
    openstack_networking_secgroup_v2.instance_ssh_access.name,
  ]

  network {
    name = "dualStack"
  }

  user_data = templatefile("${path.module}/cloud-init.yaml", {
    phone_home_url = var.phone_home_url
    init_boot_call_url = var.init_boot_call_url
    username = var.username
    jupyter_token = var.jupyter_token
    jupyter_init_start_url = var.jupyter_init_start_url
    jupyter_init_complete_url = var.jupyter_init_complete_url
  })

  depends_on = [
    openstack_networking_secgroup_v2.instance_ssh_access,
  ]
}

output "vm_ip" {
  value = openstack_compute_instance_v2.vm.access_ip_v4
}

output "vm_provision_status" {
  value = "PROVISIONING_COMPLETED"
  depends_on = [openstack_compute_instance_v2.vm]
}
