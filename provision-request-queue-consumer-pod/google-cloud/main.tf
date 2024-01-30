# Configure the Google Cloud provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Google Compute Engine virtual machine
resource "google_compute_instance" "default" {
  name         = "${var.vm_name}-${var.vm_id}"
  machine_type = var.flavor_name

  boot_disk {
    initialize_params {
      image = var.image_name
      size = var.disk_size
    }
  }

  network_interface {
    network = "default"
    access_config {
      // Ephemeral IP
    }
  }

  metadata = {
    ssh-keys = "naic-user:${var.public_key}"
    user-data = file("${path.module}/cloud-init.yaml")
  }

  tags = ["allow-ssh-icmp"]

  service_account {
    scopes = ["cloud-platform"]
  }
}

# Google Compute Firewall rule for SSH and ICMP
resource "google_compute_firewall" "allow_ssh_icmp" {
  name    = "${var.vm_name}-${var.vm_id}-allow-ssh-icmp"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = var.allow_ssh_from_v4
  target_tags   = ["allow-ssh-icmp"]
}

# Output the IP address of the VM
output "vm_ip" {
  value = google_compute_instance.default.network_interface[0].access_config[0].nat_ip
}

output "vm_provision_status" {
  value = "PROVISIONING_COMPLETED"
  depends_on = [google_compute_instance.default]
}
