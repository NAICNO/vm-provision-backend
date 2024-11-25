export default interface VmProvisioningRequestPayload {
  vm_id: string
  provider: string
  action: string
  tf_vars?: {
    vm_id: string
    vm_name : string
    public_key: string
    image_name: string
    flavor_name: string
    allow_ssh_from_v4: string[]
    init_boot_call_url: string
    phone_home_url: string
  }
}
