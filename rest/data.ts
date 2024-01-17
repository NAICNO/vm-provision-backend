// Array of dummy data
import { MachineStatus } from './src/types/MachineStatus'
import { MachineStatusInfo } from './src/types/MachineStatusInfo'

export const myMachines: MachineStatusInfo[] = [
  {
    id: '1',
    name: 'Opera Theater',
    status: MachineStatus.PROVISIONING,
    ip: '',
    os: 'CentOS Stream 9',
    vcpu: 2,
    memory: 4,
    storage: 50,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Deichman Bjorvika',
    status: MachineStatus.RUNNING,
    ip: '55.95.6.66',
    os: 'CentOS Stream 9',
    vcpu: 4,
    memory: 8,
    storage: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Central Station',
    status: MachineStatus.STOPPED,
    ip: '88.34.23.53',
    os: 'Ubuntu 20.04 LTS',
    vcpu: 8,
    memory: 16,
    storage: 200,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Slottsparken',
    status: MachineStatus.RUNNING,
    ip: '88.12.234.4',
    os: 'Ubuntu 20.04 LTS',
    vcpu: 16,
    memory: 64,
    storage: 200,
    createdAt: new Date(),
    updatedAt: new Date()
  },
]
