import { prisma } from '../models/prismaClient'
import { TFProgressLog } from '../types/TFProgressLog'
import { VmStatus } from '@prisma/client'
import logger from '../utils/logger'

export const createProvisionLog = async (vmId: string, action: string, queueName: string, logMessage: any) => {
  return prisma.provisionLog.create({
    data: {
      vmId: vmId,
      action: action,
      queueName: queueName,
      logMessage: logMessage
    }
  })
}

export const convertToTFProgressLog = (obj: any): TFProgressLog | null => {
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
    logger.error({message: 'Error converting object to TerraformLog:', error})
    return null // or handle the error as appropriate
  }
}

export const findStatusFromProvisionLog = (log: TFProgressLog, action: string): {
  status: VmStatus,
  ip: string | undefined
} => {
  let status : VmStatus = VmStatus.UNKNOWN
  let ip: string | undefined = undefined

  const logType = log.type
  const initiatedTypes = ['version']
  if (initiatedTypes.includes(logType)) {
    switch (action) {
    case 'CREATE':
      status = VmStatus.TO_BE_PROVISIONED
      break
    case 'DESTROY':
      status = VmStatus.TO_BE_DESTROYED
      break
    }
  }

  const refreshTypes = ['refresh_start', 'refresh_complete']
  if (refreshTypes.includes(logType)) {
    switch (action) {
    case 'DESTROY':
      status = VmStatus.TO_BE_DESTROYED
      break
    }
  }

  const planningTypes = ['planned_change']
  if (planningTypes.includes(logType)) {
    switch (action) {
    case 'CREATE':
      status = VmStatus.PLANNING
      break
    case 'DESTROY':
      status = VmStatus.TO_BE_DESTROYED
      break
    }
  }

  const planningCompletedTypes = ['change_summary']
  if (planningCompletedTypes.includes(logType)) {
    switch (action) {
    case 'CREATE':
      status = VmStatus.PLANNING_COMPLETED
      break
    case 'DESTROY':
      status = VmStatus.TO_BE_DESTROYED
      break
    }
  }

  const provisioningTypes = ['apply_start', 'apply_progress', 'apply_complete']
  if (provisioningTypes.includes(logType)) {
    switch (action) {
    case 'CREATE':
      status = VmStatus.PROVISIONING
      break
    case 'DESTROY':
      status = VmStatus.DESTROYING
      break
    }
  }

  const destroyCompletedTypes = ['change_summary'] // Destroy completed is same as planning completed
  if (destroyCompletedTypes.includes(logType)) {
    if (log['@message'].includes('Destroy complete!')) {
      status = VmStatus.DESTROYED
    }
  }

  if (logType === 'outputs') {
    switch (action) {
    case 'CREATE': {
      if (log.outputs?.vm_provision_status?.value === VmStatus.PROVISIONING_COMPLETED) {
        status = VmStatus.PROVISIONING_COMPLETED
        ip = log.outputs?.vm_ip?.value || undefined
      }
      break
    }
    }
  }

  const errorTypes = ['diagnostic']
  if (errorTypes.includes(logType)) {
    // @ts-ignore
    const severity = log['diagnostic']?.severity
    if (severity === 'error') {
      status = VmStatus.PROVISIONING_FAILED
    }
  }

  return {status, ip}
}
