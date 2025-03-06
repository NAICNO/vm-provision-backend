# Security group SSH + ICMP
resource "openstack_networking_secgroup_v2" "instance_ssh_access" {
  region      = var.region
  name        = "${var.vm_name}-${var.vm_id}-ssh-icmp"
  description = "Security group for allowing SSH and ICMP access"
}

# Allow ssh from IPv4 net
resource "openstack_networking_secgroup_rule_v2" "rule_ssh_access_ipv4" {
  region            = var.region
  count             = length(var.allow_ssh_from_v4)
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "tcp"
  port_range_min    = 22
  port_range_max    = 22
  remote_ip_prefix  = var.allow_ssh_from_v4[count.index]
  security_group_id = openstack_networking_secgroup_v2.instance_ssh_access.id
}

# Allow icmp from IPv4 net
resource "openstack_networking_secgroup_rule_v2" "rule_icmp_access_ipv4" {
  region            = var.region
  count             = length(var.allow_ssh_from_v4)
  direction         = "ingress"
  ethertype         = "IPv4"
  protocol          = "icmp"
  remote_ip_prefix  = var.allow_ssh_from_v4[count.index]
  security_group_id = openstack_networking_secgroup_v2.instance_ssh_access.id
}
