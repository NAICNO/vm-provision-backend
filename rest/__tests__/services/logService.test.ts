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

  it('should return undefined status and IP for REFRESH action with outputs', () => {
    const refreshOutputLog = {
      '@level': 'info',
      '@message': 'Outputs: 2',
      '@module': 'terraform.ui',
      '@timestamp': '2024-01-12T13:19:00.000000Z',
      'type': 'outputs',
      'outputs': {
        'vm_ip': {
          'value': '192.168.1.100'
        },
        'vm_provision_status': {
          'value': 'PROVISIONING_COMPLETED'
        }
      }
    }

    const log = convertToTFProgressLog(refreshOutputLog)!
    const action = 'REFRESH'
    const expected = {status: undefined, ip: '192.168.1.100'}

    const result = findStatusFromProvisionLog(log, action)

    expect(result).toEqual(expected)
  })

  it('should return undefined status and IP for REFRESH action without outputs', () => {
    const refreshLog = {
      '@level': 'info',
      '@message': 'Refreshing state...',
      '@module': 'terraform.ui',
      '@timestamp': '2024-01-12T13:19:00.000000Z',
      'type': 'refresh_start'
    }

    const log = convertToTFProgressLog(refreshLog)!
    const action = 'REFRESH'
    const expected = {status: undefined, ip: undefined}

    const result = findStatusFromProvisionLog(log, action)

    expect(result).toEqual(expected)
  })
})
