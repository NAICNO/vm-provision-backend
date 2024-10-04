import { VmStatus } from '@prisma/client'

import { convertToTFProgressLog, findStatusFromProvisionLog } from '../../src/services/tfLogService'

const appy_start_json = '{"hook":{"action":"create","resource":{"addr":"google_compute_firewall.allow_ssh_icmp","module":"","resource":"google_compute_firewall.allow_ssh_icmp","resource_key":null,"resource_name":"allow_ssh_icmp","resource_type":"google_compute_firewall","implied_provider":"google"}},"type":"apply_start","@level":"info","@module":"terraform.ui","@message":"google_compute_firewall.allow_ssh_icmp: Creating...","@timestamp":"2024-01-12T13:18:59.213112Z"}'

describe('findStatusFromProvisionLog', () => {
  it('should return the correct status for given log and action', () => {

    const parsedLog = JSON.parse(appy_start_json)
    const log = convertToTFProgressLog(parsedLog)!

    const action = 'CREATE'
    const expected = {status: VmStatus.PROVISIONING, ip: undefined}

    const result = findStatusFromProvisionLog(log, action)

    expect(result).toEqual(expected)
  })
})
