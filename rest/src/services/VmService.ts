import * as Sentry from '@sentry/node'
import { Message, PrismaClient, Provider, VirtualMachine, VmPublicKey, VmTemplate } from '@prisma/client'

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
import { GenericResponse } from '../types/GenericResponse'
import { getIoInstance, getSocketIdByUsername } from '../sockets'
import { WebSocketEventType } from '../utils/WebSocketEventType'
import { getFolderNameForProvider } from '../utils/Utils'
import * as LogService from './LogService'

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
      vmTemplate: {
        include: {
          provider: true,
        }
      },
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

const createVm = async (prisma: Omit<PrismaClient, ITXClientDenyList>, userId: string, vmTemplateId: string, vmName: string, sshKeyId: string, duration: number) => {
  return prisma.virtualMachine.create({
    data: {
      userId: userId,
      templateId: vmTemplateId,
      vmName: vmName,
      publicKeyId: sshKeyId,
      duration: duration,
      status: VmStatusType.TO_BE_PROVISIONED,
    },
  })
}


export const startVmProvisioning = async (userId: string | undefined, vmName: string, vmTemplateId: string, sshKeyId: string, duration: number) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }

  const publicKey = await SshKeyService.findPublicKey(sshKeyId)
  const template = await getVmTemplateById(vmTemplateId)
  const provider = await getProviderById(template.providerId)
  try {

    const {
      virtualMachine,
      queueName,
      message
    } = await createVmInTransaction(userId, vmTemplateId, vmName, sshKeyId, template, provider, publicKey, duration)

    const vmId = virtualMachine.vmId

    UserService.logUserActivity(userId, UserActivityType.VM_CREATION_REQUESTED, {vmId: vmId})
    logVmEvent(vmId, VmEventType.PROVISIONING_REQUESTED, null)

    await MessageQueueService.publishMessage(queueName, message)

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

export const startVmDestroy = async (vm: VirtualMachine) => {

  const template = await getVmTemplateById(vm.templateId)
  const provider = await getProviderById(template.providerId)

  const {
    queueName,
    message
  } = await destroyVmInTransaction(vm, provider)

  UserService.logUserActivity(vm.userId, UserActivityType.VM_DESTROY_REQUESTED, {vmId: vm.vmId})
  logVmEvent(vm.vmId, VmEventType.DESTROYING_REQUESTED, null)

  await MessageQueueService.publishMessage(queueName, message)
}

async function createVmInTransaction(
  userId: string,
  vmTemplateId: string,
  vmName: string,
  sshKeyId: string,
  template: VmTemplate,
  provider: Provider,
  publicKey: VmPublicKey,
  duration: number):
  Promise<{
    virtualMachine: VirtualMachine,
    queueName: string,
    message: Message
  }> {
  return prisma.$transaction(async (tx) => {

    const virtualMachine = await createVm(tx, userId, vmTemplateId, vmName, sshKeyId, duration)

    const vmId = virtualMachine.vmId
    const messageToPublish = prepareVmCreationRequestMessage(virtualMachine, template, provider, publicKey)
    const messageToPublishString = JSON.stringify(messageToPublish)

    const message = await MessageQueueService
      .addToMessageQueue(tx, VM_PROVISIONING_REQUESTS_QUEUE, messageToPublishString, userId, vmId, null)

    return {
      virtualMachine,
      queueName: VM_PROVISIONING_REQUESTS_QUEUE,
      message
    }
  })
}

async function destroyVmInTransaction(vm: VirtualMachine, provider: Provider):
  Promise<{
    queueName: string,
    message: Message
  }> {
  return prisma.$transaction(async (tx) => {

    console.log('destroyVmInTransaction', vm.vmId)

    const updatedVm = await prisma.virtualMachine.update(
      {
        where: {
          vmId: vm.vmId,
        },
        data: {
          status: VmStatusType.TO_BE_DESTROYED,
          updatedAt: new Date(),
        }
      }
    )

    console.log('updatedVm', updatedVm)

    const messageToPublish = prepareVmDestroyRequestMessage(vm.vmId, provider)
    const messageToPublishString = JSON.stringify(messageToPublish)

    const message = await MessageQueueService
      .addToMessageQueue(tx, VM_PROVISIONING_REQUESTS_QUEUE, messageToPublishString, vm.userId, vm.vmId, null)

    return {
      queueName: VM_PROVISIONING_REQUESTS_QUEUE,
      message
    }
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

export const updateVmProvisioningStatus = async (vmId: string, action: string, queueName: string, message: any): Promise<GenericResponse> => {

  await LogService.createProvisionLog(vmId, action, queueName, message)

  const log = LogService.convertToTFProgressLog(message)
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
  } = LogService.findStatusFromProvisionLog(log, action)

  const nextStatus = findNextVmState(currentStatus, statusFromLog)

  if (nextStatus === currentStatus) {
    console.log('No status change', currentStatus, nextStatus)
    return GenericResponse.error
  } else {
    console.log('Status change', currentStatus, nextStatus)

    const update = {
      status: nextStatus,
      ...(ipFromLog !== undefined && {ipv4Address: ipFromLog}),
      ...(ipFromLog !== undefined && {startedAt: new Date()}),
      updatedAt: new Date(),
    }

    const updatedVm: VirtualMachine = await prisma.virtualMachine.update({
      where: {
        vmId: vmId,
      },
      data: {...update},
    })

    const vmOwner = updatedVm.userId

    const messagePayload = {
      vmId: vmId,
      ...update
    }

    await sendMessageToSpecificUser(vmOwner, messagePayload)

    console.log('Vm status updated', vmId, nextStatus)
    return GenericResponse.success
  }
}

export const getExpiredVms = async () => {
  // Find vms that are in running state and have expired

  //Get all running vms which have their startedAt set
  const allRunningVms = await prisma.virtualMachine.findMany({
    where: {
      status: VmStatusType.PROVISIONING_COMPLETED,
      startedAt: {
        not: null
      }
    },
  })

  const now = new Date()
  return allRunningVms.filter((vm) => {
    const vmStartedAt = vm.startedAt
    const vmDuration = vm.duration
    const vmExpirationDate = new Date(vmStartedAt!.getTime() + vmDuration * 60 * 60 * 1000)
    return now > vmExpirationDate
  })
}

const findNextVmState = (currentStatus: VmStatusType, nextStatus: VmStatusType): VmStatusType => {
  return validNextStates[currentStatus].includes(nextStatus) ? nextStatus : currentStatus
}



export const getVmById = async (vmId: string) => {
  return prisma.virtualMachine.findUnique({
    where: {
      vmId: vmId,
    },
  })
}

const getVmTemplateById = async (templateId: string) => {
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

const prepareVmCreationRequestMessage = (
  virtualMachine: VirtualMachine,
  template: VmTemplate,
  provider: Provider,
  publicKey: VmPublicKey)
  : VmProvisioningRequestPayload => {

  const vm_name = virtualMachine.vmName
  const public_key = publicKey.publicKey
  const image_name = template.os
  const flavor_name = template.falvorName
  const allow_ssh_from_v4 = ALLOWED_IP_RANGES

  const vm_id = virtualMachine.vmId
  const folderName = getFolderNameForProvider(provider.providerName)

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
    provider: folderName,
    action: 'CREATE',
    tf_vars,
  }
}

const getProviderById = async (providerId: string) => {
  try {
    return prisma.provider.findUniqueOrThrow({
      where: {
        providerId: providerId,
      },
    })
  } catch (e) {
    const error = new Error(ErrorMessages.InternalServerError)
    Sentry.captureException(error, {
      contexts: {
        message: {
          vmTemplateId: providerId,
          message: 'VM Provider not found'
        }
      }
    })
    throw error
  }
}

const prepareVmDestroyRequestMessage = (vmId: string, provider: Provider): VmProvisioningRequestPayload => {
  const folderName = getFolderNameForProvider(provider.providerName)
  return {
    vm_id: vmId,
    provider: folderName,
    action: 'DESTROY'
  }
}




