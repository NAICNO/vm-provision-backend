# Configure the Google Cloud provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Google Compute Engine network and subnetwork
resource "google_compute_network" "vpc_network" {
  name                    = "naic-vm-${var.vm_id}-vpc-network"
  auto_create_subnetworks = false
  mtu                     = 1460
}

resource "google_compute_subnetwork" "default" {
  name          = "naic-vm-${var.vm_id}-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc_network.id
}

# Google Compute Firewall rule for SSH and ICMP
resource "google_compute_firewall" "allow_ssh_icmp" {
  name = "naic-vm-${var.vm_id}-allow-ssh-icmp"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  allow {
    protocol = "icmp"
  }

  direction     = "INGRESS"
  network       = google_compute_network.vpc_network.id
  source_ranges = var.allow_ssh_from_v4
  target_tags   = ["naic-vm-allow-ssh-icmp-${var.vm_id}"]
}

# Google Compute Engine virtual machine
resource "google_compute_instance" "default" {
  name         = "naic-vm-${var.vm_id}"
  machine_type = var.flavor_name

  boot_disk {
    initialize_params {
      image = var.image_name
      size  = var.disk_size
    }
  }

  metadata = {
    ssh-keys  = "naic-user:${var.public_key}"
    user-data = templatefile("${path.module}/cloud-init.yaml", {
      init_boot_call_url = var.init_boot_call_url
      phone_home_url     = var.phone_home_url
      username           = var.username
      jupyter_token      = var.jupyter_token
      jupyter_init_start_url    = var.jupyter_init_start_url
      jupyter_init_complete_url = var.jupyter_init_complete_url
    })
  }

  tags = ["naic-vm-allow-ssh-icmp-${var.vm_id}"]

  network_interface {
    subnetwork = google_compute_subnetwork.default.id

    access_config {
      # Include this section to give the VM an external IP address
    }
  }

  labels = {
    "env" = "naic-vm"
  }
}

# Output the IP address of the VM
output "vm_ip" {
  value = google_compute_instance.default.network_interface[0].access_config[0].nat_ip
}

output "vm_provision_status" {
  value      = "PROVISIONING_COMPLETED"
  depends_on = [google_compute_instance.default]
}
