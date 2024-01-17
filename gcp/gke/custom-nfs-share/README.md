This folder contains the configurations which are used with owned custom made NFS share.
# Setting Up NFS Server on Google Compute Engine

1. Create a GCE Instance:

* Go to the Google Cloud Console.
* Navigate to Compute Engine and create a new VM instance.
* Choose an appropriate machine type based on your workload.
* Select a Linux-based OS image, like Ubuntu or CentOS.

2. Install and Configure NFS:

* SSH into your newly created GCE instance.
* Install NFS server packages. For Ubuntu/Debian: `sudo apt-get install nfs-kernel-server`. For CentOS/RHEL: `sudo yum install nfs-utils`.
* Create a directory that you want to share with your Kubernetes pods, e.g., `sudo mkdir /var/nfs_share`.
* Edit `/etc/exports` to configure NFS exports. Add a line like `/var/nfs_share *(rw,sync,no_root_squash,subtree_check)` to share with any IP (consider restricting it to your cluster's IP range for security).

3. Start and Enable NFS Service:

* Start the NFS service: `sudo systemctl start nfs-kernel-server` on Ubuntu/Debian or `sudo systemctl start nfs-server` on CentOS/RHEL.
* Enable the NFS service to start on boot: `sudo systemctl enable nfs-kernel-server` or _sudo systemctl enable nfs-server_.

4.Configure Firewall Rules:

* On the GCE console, go to the VM instance details and edit the firewall rules.
* Allow NFS traffic (typically TCP and UDP on ports 2049, 111, and 20048).

## Integrating NFS with Kubernetes Autopilot

* Create a PersistentVolume (PV)
* Create a PersistentVolumeClaim (PVC)
* Deploy Pods/Workloads Using the PVC
