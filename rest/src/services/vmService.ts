import * as Sentry from '@sentry/node'
import {
  Message,
  Prisma,
  PrismaClient,
  Provider,
  UserActivityType,
  VirtualMachine,
  VmPublicKey,
  VmTemplate,
  VmEventType,
  VmStatus,
  UrlAction,
} from '@prisma/client'
import { ITXClientDenyList } from '@prisma/client/runtime/library'

import { prisma } from '../models/prismaClient'
import { ErrorMessages } from '../utils/errorMessages'
import * as UserService from './userService'
import * as MessageQueueService from './messageQueueService'
import * as SshKeyService from './sshKeyService'
import * as AppUrlService from './appUrlService'
import * as SocketService from './socketService'
import { URL_ACTION_TO_VM_STATUS_MAP, validNextStates } from '../utils/vmStatusUtils'
import { VM_PROVISIONING_REQUESTS_QUEUE } from '../utils/constants'
import VmProvisioningRequestPayload from '../types/VmProvisioningRequestPayload'
import { GenericResponse } from '../types/GenericResponse'

import { getFolderNameForProvider } from '../utils/utils'
import * as TfLogService from './tfLogService'
import { CREATE_ACTIONS, DESTROY_ACTIONS } from '../utils/urlActionUtils'
import { getFullAppUrl } from './appUrlService'
import logger from '../utils/logger'

export const getAllVmsOfUserWithTemplates = async (userId: string) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }

  const whereClause = Prisma.validator<Prisma.VirtualMachineWhereInput>()({
    userId: userId,
  })

  const includeClause = Prisma.validator<Prisma.VirtualMachineInclude>()({
    vmTemplate: {
      include: {
        provider: true,
      }
    },
  })

  const orderByClause = Prisma.validator<Prisma.VirtualMachineOrderByWithAggregationInput>()({
    createdAt: 'desc',
  })

  return prisma.virtualMachine.findMany({
    where: whereClause,
    include: includeClause,
    orderBy: orderByClause,
  })
}

export const getAllVmsOfUser = async (userId: string) => {
  return prisma.virtualMachine.findMany({
    where: {
      userId: userId,
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
        },
        where: {
          enabled: true,
        }
      }
    )
}

export const getUserVmQuota = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }

  const allocatedQuota: number = parseInt(process.env.VM_QUOTA_PER_USER || '1')

  const activeVms = await countActiveVms(userId)

  return {
    remainingQuota: allocatedQuota - activeVms,
    allocatedQuota: allocatedQuota,
  }
}

const countActiveVms = async (userId: string) => {
  return prisma.virtualMachine.count({
    where: {
      userId: userId,
      status: {
        notIn: [VmStatus.DESTROYED, VmStatus.UNKNOWN, VmStatus.STOPPED, VmStatus.SHUTDOWN]
      }
    }
  })
}

const createVm = async (prisma: Omit<PrismaClient, ITXClientDenyList>, userId: string, vmTemplateId: string, vmName: string, sshKeyId: string, duration: number, ipRanges: string[]) => {
  return prisma.virtualMachine.create({
    data: {
      userId: userId,
      templateId: vmTemplateId,
      vmName: vmName,
      publicKeyId: sshKeyId,
      duration: duration,
      ipRanges: ipRanges,
      status: VmStatus.TO_BE_PROVISIONED,
    },
  })
}

export const startVmProvisioning = async (userId: string | undefined, vmName: string, vmTemplateId: string, sshKeyId: string, duration: number, ipRanges: string[]) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }

  const userQuota = await getUserVmQuota(userId)
  if (userQuota.remainingQuota <= 0) {
    throw new Error(ErrorMessages.VmQuotaExceeded)
  }

  const publicKey = await SshKeyService.findPublicKey(sshKeyId)
  const template = await getVmTemplateById(vmTemplateId)
  const provider = await getProviderById(template.providerId)
  try {

    const {
      virtualMachine,
      queueName,
      message
    } = await createVmInTransaction(userId, vmTemplateId, vmName, sshKeyId, template, provider, publicKey, duration, ipRanges)

    const vmId = virtualMachine.vmId

    UserService.logUserActivity(userId, UserActivityType.VM_CREATION_REQUESTED, '', {vmId: vmId})
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

export const requestVmDestroy = async (vmId: string, userId?: string) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }
  const vm = await getVmOfUserById(vmId, userId)
  if (!vm) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }
  await startVmDestroy(vm)
}

export const startVmDestroy = async (vm: VirtualMachine) => {
  const template = await getVmTemplateById(vm.templateId)
  const provider = await getProviderById(template.providerId)

  const {
    queueName,
    message
  } = await destroyVmInTransaction(vm, provider)

  UserService.logUserActivity(vm.userId, UserActivityType.VM_DESTROY_REQUESTED, '', {vmId: vm.vmId})
  logVmEvent(vm.vmId, VmEventType.DESTROYING_REQUESTED, null)

  await MessageQueueService.publishMessage(queueName, message)
}

export const archiveVm = async (vmId: string, userId?: string) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }
  const vm = await getVmOfUserById(vmId, userId)
  if (!vm) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }

  const currentVm = await getVmById(vmId)
  const currentMetadata = currentVm?.metadata as Prisma.JsonObject

  const updatedMetadata = {
    ...currentMetadata,
    archived: true,
  }

  await prisma.virtualMachine.update({
    where: {
      vmId: vmId,
    },
    data: {
      metadata: updatedMetadata,
      updatedAt: new Date(),
    }

  })
}

async function createVmInTransaction(
  userId: string,
  vmTemplateId: string,
  vmName: string,
  sshKeyId: string,
  template: VmTemplate,
  provider: Provider,
  publicKey: VmPublicKey,
  duration: number,
  ipRanges: string[]):
  Promise<{
    virtualMachine: VirtualMachine,
    queueName: string,
    message: Message
  }> {
  return prisma.$transaction(async (tx) => {

    const virtualMachine = await createVm(tx, userId, vmTemplateId, vmName, sshKeyId, duration, ipRanges)

    const vmId = virtualMachine.vmId

    const notifyVmInitStartUrl = await AppUrlService.createAppUrl(tx, UrlAction.NOTIFY_VM_INITIALIZE_START, {vmId: virtualMachine.vmId})
    const notifyVmInitCompleteUrl = await AppUrlService.createAppUrl(tx, UrlAction.NOTIFY_VM_INITIALIZE_COMPLETE, {vmId: virtualMachine.vmId})

    const notifyVmInitStartUrlString = getFullAppUrl(notifyVmInitStartUrl)
    const notifyVmInitCompleteUrlString = getFullAppUrl(notifyVmInitCompleteUrl)

    const messageToPublish = prepareVmCreationRequestMessage(virtualMachine, template, provider, publicKey, notifyVmInitStartUrlString, notifyVmInitCompleteUrlString)
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

    await prisma.virtualMachine.update(
      {
        where: {
          vmId: vm.vmId,
        },
        data: {
          status: VmStatus.TO_BE_DESTROYED,
          updatedAt: new Date(),
        }
      }
    )

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
  prisma.vmEvent.create({
    data: {
      vmId: vmId,
      eventType: eventType,
      description: description,
    },
  })
}

export const updateVmProvisioningStatusByTfLog = async (vmId: string, action: string, queueName: string, message: any): Promise<GenericResponse> => {
  try {
    await logProvisioningStatus(vmId, action, queueName, message)

    const log = TfLogService.convertToTFProgressLog(message)
    if (!log) {
      return GenericResponse.error
    }

    const vm = await getVmById(vmId)
    if (!vm) {
      return GenericResponse.error
    }

    const currentStatus: VmStatus = vm.status || VmStatus.UNKNOWN
    const {
      status: statusFromLog,
      ip: ipFromLog
    } = TfLogService.findStatusFromProvisionLog(log, action)

    const updatedVm = await updateVmStatus(vmId, statusFromLog, currentStatus, ipFromLog)

    await sendUserUpdateMessage(updatedVm.userId, vmId, {status: updatedVm.status, ipv4Address: updatedVm.ipv4Address})

    return GenericResponse.success
  } catch (error) {
    logger.error('Error updating VM status via TF log', {vmId, error})
    return GenericResponse.error
  }
}

export const updateVmProvisioningStatusByRestCallback = async (vmId: string, urlAction: UrlAction): Promise<GenericResponse> => {

  try {
    if (!(urlAction in URL_ACTION_TO_VM_STATUS_MAP)) {
      throw new Error(`Invalid urlActionType: ${urlAction}`)
    }

    const action = getActionByUrlAction(urlAction)

    await logProvisioningStatus(vmId, action, 'REST_CALLBACK', {urlAction})

    //Get status from the vm by urlActionType
    const statusFromUrlAction: VmStatus = URL_ACTION_TO_VM_STATUS_MAP[urlAction as keyof typeof URL_ACTION_TO_VM_STATUS_MAP]

    const vm = await getVmById(vmId)

    const currentStatus = vm?.status || VmStatus.UNKNOWN

    const updatedVm = await updateVmStatus(vmId, statusFromUrlAction, currentStatus)

    await sendUserUpdateMessage(updatedVm.userId, vmId, {status: updatedVm.status})

    return GenericResponse.success
  } catch (error) {
    logger.error('Error updating VM status via REST callback', {vmId, error})
    return GenericResponse.error
  }

}

export const getActionByUrlAction = (action: UrlAction): string => {
  if (CREATE_ACTIONS.includes(action)) {
    return 'CREATE'
  } else if (DESTROY_ACTIONS.includes(action)) {
    return 'DESTROY'
  } else {
    return 'UNKNOWN'
  }
}

export const logProvisioningStatus = async (vmId: string, action: string, queueName: string, message: any) => {
  await TfLogService.createProvisionLog(vmId, action, queueName, message)
}

export const updateVmStatus = async (vmId: string, statusFromLog: VmStatus, currentStatus: VmStatus, ipFromLog?: string): Promise<VirtualMachine> => {
  const nextStatus = findNextVmState(currentStatus, statusFromLog)

  if (nextStatus === currentStatus) {
    logger.debug('No status change', {vmId, currentStatus, nextStatus})
    throw new Error('No status change')
  } else {
    logger.debug('Status change', {vmId, currentStatus, nextStatus})

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

    logger.debug('Vm status updated', {vmId, nextStatus})
    return updatedVm
  }
}

export const sendUserUpdateMessage = async (vmOwner: string, vmId: string, update: any) => {
  const messagePayload = {
    vmId: vmId,
    ...update
  }

  await SocketService.sendMessageToSpecificUser(vmOwner, messagePayload)
}


export const getExpiredVms = async () => {
  // Find vms that are in running state and have expired

  //Get all running vms which have their startedAt set
  const allRunningVms = await prisma.virtualMachine.findMany({
    where: {
      status: VmStatus.RUNNING,
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

export const findNextVmState = (currentStatus: VmStatus, nextStatus: VmStatus): VmStatus => {
  return validNextStates[currentStatus].includes(nextStatus) ? nextStatus : currentStatus
}


export const getVmById = async (vmId: string) => {
  return prisma.virtualMachine.findUnique({
    where: {
      vmId: vmId,
    },
  })
}

export const getVmOfUserById = async (vmId: string, userId: string) => {
  return prisma.virtualMachine.findUniqueOrThrow({
    where: {
      vmId: vmId,
      userId: userId,
    },
    include: {
      vmTemplate: {
        include: {
          provider: true,
        }
      },
      publicKey: true,
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
  publicKey: VmPublicKey,
  notifyVmInitStartUrlString: string,
  notifyVmInitCompleteUrlString: string)
  : VmProvisioningRequestPayload => {

  const vm_name = virtualMachine.vmName
  const public_key = publicKey.publicKey
  const image_name = template.os
  const flavor_name = template.falvorName
  const allow_ssh_from_v4 = virtualMachine.ipRanges

  const vm_id = virtualMachine.vmId
  const folderName = getFolderNameForProvider(provider.providerName)

  const tf_vars = {
    vm_id,
    vm_name,
    public_key,
    image_name,
    flavor_name,
    allow_ssh_from_v4,
    init_boot_call_url: notifyVmInitStartUrlString,
    phone_home_url: notifyVmInitCompleteUrlString,
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
