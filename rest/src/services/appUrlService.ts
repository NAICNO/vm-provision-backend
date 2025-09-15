import { AppUrl, PrismaClient, UrlAction } from '@prisma/client'
import { ITXClientDenyList } from '@prisma/client/runtime/library'

import { prisma } from '../models/prismaClient'
import * as VmService from './vmService'
import { ErrorMessages } from '../utils/errorMessages'
import logger from '../utils/logger'
import { generateToken } from '../utils/utils'

export const createAppUrl = async (tx: Omit<PrismaClient, ITXClientDenyList>, action: UrlAction, metadata: any): Promise<AppUrl> => {
  return tx.appUrl.create({
    data: {
      action: action,
      token: generateToken(),
      metadata: metadata,
    }
  })
}

export const getFullAppUrl = (appUrl: AppUrl): string => {
  return `${process.env.CLOUD_INIT_CALLBACK_BASE_URL}/${appUrl.token}`
}

export const findAppUrl = async (token: string): Promise<AppUrl> => {
  return prisma.appUrl.findUniqueOrThrow({
    where: {
      token: token
    }
  })
}

export const handleAppUrl = async (appUrl: AppUrl) => {

  const actionType = appUrl.action

  switch (actionType) {
  case UrlAction.NOTIFY_VM_INITIALIZE_START:
  case UrlAction.NOTIFY_VM_INITIALIZE_COMPLETE: {
    const metadata = appUrl.metadata as Record<string, unknown>
    const vmId = metadata['vmId'] as string
    await VmService.updateVmProvisioningStatusByRestCallback(vmId, actionType)
    await markAppUrlAsUsed(appUrl)
    break
  }
  case UrlAction.NOTIFY_VM_JUPYTERNOTEBOOK_INIT_START: {
    const metadata = appUrl.metadata as Record<string, unknown>
    const vmId = metadata['vmId'] as string
    logger.info({message: `Jupyter Notebook init started for: ${vmId}`})
    await markAppUrlAsUsed(appUrl)
    break
  }
  case UrlAction.NOTIFY_VM_JUPYTERNOTEBOOK_INIT_COMPLETE: {
    const metadata = appUrl.metadata as Record<string, unknown>
    const vmId = metadata['vmId'] as string
    logger.info({message: `Jupyter Notebook ini completed for: ${vmId}`})
    await markAppUrlAsUsed(appUrl)
    break
  }

  default:
    logger.info({message: `Unknown action type for action type: ${actionType}`, appUrl})
  }
}

export const markAppUrlAsUsed = (appUrl?: AppUrl): Promise<AppUrl> => {
  if (!appUrl) {
    throw new Error(ErrorMessages.AppUrlInvalidOrExpired)
  }
  const now = new Date()
  return prisma.appUrl.update({
    where: {
      urlId: appUrl.urlId,
    },
    data: {
      usedAt: now,
      updatedAt: now
    }
  })
}
