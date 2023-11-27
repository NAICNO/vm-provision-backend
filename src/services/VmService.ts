import { prisma } from '../models/PrismaClient'
import { ErrorMessages } from '../utils/ErrorMessages'
import * as UserService from './UserService'
import { UserActivityType } from '../utils/UserActivityType'
import { VmStatusType } from '../utils/VmStatusType'
import { VmEventType } from '../utils/VmEventType'

export const getAllUserVms = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }
  return prisma.virtualMachine.findMany({
    where: {
      userId: userId,
    },
    include: {
      vmTemplate: true,
    }
  })
}
export const getAllVmTemplates = async () => {
  return prisma.vmTemplate.findMany()
}

export const createVm = async (userId: string | undefined, vmName: string, vmTemplateId: string, sshKeyId: string) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }

  const result = await prisma.virtualMachine.create({
    data: {
      userId: userId,
      templateId: vmTemplateId,
      vmName: vmName,
      publicKeyId: sshKeyId,
      status: VmStatusType.TO_BE_PROVISIONED,
    },
  })
  const vmId = result.vmId
  UserService.logUserActivity(userId, UserActivityType.VM_CREATION_REQUESTED, {vmId: vmId})
  logVmEvent(vmId, VmEventType.PROVISIONING_REQUESTED, null)
  return {vmId}
}

export const logVmEvent = (vmId: string, eventType: VmEventType, data: any) => {
  const description = data ? JSON.stringify(data) : ''
  console.log('logVmEvent', vmId, eventType, description)
  prisma.vmEvent.create({
    data: {
      vmId: vmId,
      eventType: eventType,
      description: description,
    },
  }).then(() => {
    console.log('Vm Event logged', vmId, eventType, description)
  })
}


