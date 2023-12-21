import * as Sentry from '@sentry/node'
import { Message, PrismaClient, VirtualMachine, VmPublicKey, VmTemplate } from '@prisma/client'

import { prisma } from '../models/PrismaClient'
import { ErrorMessages } from '../utils/ErrorMessages'
import * as UserService from './UserService'
import * as MessageQueueService from './MessageQueueService'
import * as SshKeyService from './SshKeyService'
import { UserActivityType } from '../utils/UserActivityType'
import { validNextStates, VmStatusType } from '../utils/VmStatusType'
import { VmEventType } from '../utils/VmEventType'
import { ALLOWED_IP_RANGES, VM_PROVISIONING_REQUESTS_QUEUE } from '../utils/Constants'
import VmProvisioningRequestPayload from '../types/VmProvisioningRequestPayload'
import { ITXClientDenyList } from '@prisma/client/runtime/library'
import { TFProgressLog } from '../types/TFProgressLog'
import { GenericResponse } from '../types/GenericResponse'
import { getIoInstance, getSocketIdByUsername } from '../sockets'
import { WebSocketEventType } from '../utils/WebSocketEventType'

export const getAllUserVms = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }
  getIoInstance()
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
  return prisma.vmTemplate
    .findMany(
      {
        orderBy: {
          templateName: 'desc',
        },
        include: {
          provider: true,
        }
      }
    )
}

export const sendMessageToSpecificUser = async (userId: string, message: any) => {
  // ... your existing logic
  const user = await UserService.findUserProfileById(userId)

  if (user) {
    const io = getIoInstance()
    const socketID = getSocketIdByUsername(user.username)
    const namespace = process.env.SOCKET_NAMESPACE_VM || '/vm'
    if (socketID) {
      io.of(namespace).to(socketID).emit(WebSocketEventType.PROVISIONING_UPDATE, message)
    }

  }
}

const createVm = async (prisma: Omit<PrismaClient, ITXClientDenyList>, userId: string, vmTemplateId: string, vmName: string, sshKeyId: string) => {
  return prisma.virtualMachine.create({
    data: {
      userId: userId,
      templateId: vmTemplateId,
      vmName: vmName,
      publicKeyId: sshKeyId,
      status: VmStatusType.TO_BE_PROVISIONED,
    },
  })
}


export const startVmProvisioning = async (userId: string | undefined, vmName: string, vmTemplateId: string, sshKeyId: string) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }

  const publicKey = await SshKeyService.findPublicKey(sshKeyId)
  const template = await findTemplate(vmTemplateId)
  try {

    const {
      virtualMachine,
      message
    } = await createVmInTransaction(userId, vmTemplateId, vmName, sshKeyId, template, publicKey)

    const vmId = virtualMachine.vmId

    UserService.logUserActivity(userId, UserActivityType.VM_CREATION_REQUESTED, {vmId: vmId})
    logVmEvent(vmId, VmEventType.PROVISIONING_REQUESTED, null)

    await MessageQueueService.publishCreateVmRequest(message)

    return virtualMachine.vmId

  } catch (error) {
    Sentry.captureException(error, {
      contexts: {
        message: {
          vmTemplateId: vmTemplateId,
          message: 'Failed to publish create VM request'
        }
      }
    })
    throw new Error(ErrorMessages.CannotCreateVmDueToServerError)
  }
}

async function createVmInTransaction(userId: string, vmTemplateId: string, vmName: string, sshKeyId: string, template: VmTemplate, publicKey: VmPublicKey):
  Promise<{
    virtualMachine: VirtualMachine,
    message: Message
  }> {
  return prisma.$transaction(async (tx) => {

    const virtualMachine = await createVm(tx, userId, vmTemplateId, vmName, sshKeyId)

    const vmId = virtualMachine.vmId
    const messageToPublish = prepareVmCreationRequestMessage(virtualMachine, template, publicKey)
    const messageToPublishString = JSON.stringify(messageToPublish)

    const message = await MessageQueueService
      .addToMessageQueue(tx, VM_PROVISIONING_REQUESTS_QUEUE, messageToPublishString, userId, vmId, null)

    return {virtualMachine, message}
  })
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

export const updateVmProvisioningStatus = async (vmId: string, queueName: string, message: any): Promise<GenericResponse> => {

  await createProvisionLog(vmId, queueName, message)

  const log = toTFProgressLog(message)
  if (!log) {
    console.error('Invalid message received', message)
    return GenericResponse.error
  }

  const vm = await getVmById(vmId)
  if (!vm) {
    console.error('VM not found', vmId)
    return GenericResponse.error
  }

  const currentStatus = vm.status || VmStatusType.UNKNOWN
  const {
    status: statusFromLog,
    ip: ipFromLog
  } = findStatusFromProvisionLog(log)

  const nextStatus = findNextVmState(currentStatus, statusFromLog)

  if (nextStatus === currentStatus) {
    console.log('No status change', currentStatus, nextStatus)
    return GenericResponse.error
  } else {
    console.log('Status change', currentStatus, nextStatus)
    const updatedVm: VirtualMachine = await prisma.virtualMachine.update({
      where: {
        vmId: vmId,
      },
      data: {
        status: nextStatus,
        ...(ipFromLog !== undefined && {ipv4Address: ipFromLog}),
        updatedAt: new Date(),
      },
    })

    const vmOwner = updatedVm.userId

    const messagePayload = {
      vmId: vmId,
      status: nextStatus,
      ...(ipFromLog !== undefined && {ipv4Address: ipFromLog}),
    }

    await sendMessageToSpecificUser(vmOwner, messagePayload)

    console.log('Vm status updated', vmId, nextStatus)
    return GenericResponse.success
  }
}

const createProvisionLog = async (vmId: string, queueName: string, logMessage: any) => {
  return prisma.provisionLog.create({
    data: {
      vmId: vmId,
      queueName: queueName,
      logMessage: logMessage
    }
  })
}

const findStatusFromProvisionLog = (log: TFProgressLog): { status: VmStatusType, ip: string | undefined } => {
  let status = VmStatusType.UNKNOWN
  let ip: string | undefined = undefined

  const logType = log.type
  const initiatedTypes = ['version']
  if (initiatedTypes.includes(logType)) {
    status = VmStatusType.TO_BE_PROVISIONED
  }

  const planningTypes = ['planned_change']
  if (planningTypes.includes(logType)) {
    status = VmStatusType.PLANNING
  }

  const planningCompletedTypes = ['change_summary']
  if (planningCompletedTypes.includes(logType)) {
    status = VmStatusType.PLANNING_COMPLETED
  }

  const provisioningTypes = ['apply_start', 'apply_progress', 'apply_complete']
  if (provisioningTypes.includes(logType)) {
    status = VmStatusType.PROVISIONING
  }

  if (logType === 'outputs') {
    if (log.outputs?.vm_provision_status?.value === VmStatusType.PROVISIONING_COMPLETED) {
      status = VmStatusType.PROVISIONING_COMPLETED
      ip = log.outputs?.vm_ip?.value || undefined
    }
  }
  return {status, ip}
}

const findNextVmState = (currentStatus: VmStatusType, nextStatus: VmStatusType): VmStatusType => {
  return validNextStates[currentStatus].includes(nextStatus) ? nextStatus : currentStatus
}

function toTFProgressLog(obj: any): TFProgressLog | null {
  try {
    if (typeof obj['@level'] !== 'string'
      || typeof obj['@message'] !== 'string'
      || typeof obj['@module'] !== 'string'
      || typeof obj['@timestamp'] !== 'string'
      || typeof obj['type'] !== 'string'
    ) {
      throw new Error('Invalid object structure')
    }

    // If all checks pass, cast the object and return
    return obj as TFProgressLog
  } catch (error) {
    console.error('Error converting object to TerraformLog:', error)
    return null // or handle the error as appropriate
  }
}

export const getVmById = async (vmId: string) => {
  return prisma.virtualMachine.findUnique({
    where: {
      vmId: vmId,
    },
  })
}

const findTemplate = async (templateId: string): Promise<VmTemplate> => {
  try {
    return await prisma.vmTemplate.findUniqueOrThrow({
      where: {
        templateId: templateId,
      },
    })
  } catch (e) {
    const error = new Error(ErrorMessages.InternalServerError)
    Sentry.captureException(error, {
      contexts: {
        message: {
          vmTemplateId: templateId,
          message: 'VM template not found'
        }
      }
    })
    throw error
  }
}

const prepareVmCreationRequestMessage = (virtualMachine: VirtualMachine, template: VmTemplate, publicKey: VmPublicKey): VmProvisioningRequestPayload => {
  const vm_name = virtualMachine.vmName
  const public_key = publicKey.publicKey
  const image_name = template.os
  const flavor_name = template.falvorName
  const allow_ssh_from_v4 = ALLOWED_IP_RANGES

  const vm_id = virtualMachine.vmId

  const tf_vars = {
    vm_id,
    vm_name,
    public_key,
    image_name,
    flavor_name,
    allow_ssh_from_v4,
  }

  return {
    vm_id,
    tf_vars,
  }
}




