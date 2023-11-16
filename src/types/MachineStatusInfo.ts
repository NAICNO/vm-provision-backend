import { MachineStatus } from './MachineStatus'

export interface MachineStatusInfo {
  id: string
  name: string
  status: MachineStatus
  ip: string
  os: string
  vcpu: number
  memory: number
  storage: number
  createdAt: Date
  updatedAt: Date
}


