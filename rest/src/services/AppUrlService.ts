import * as crypto from 'crypto'
import { AppUrl, PrismaClient, UrlAction } from '@prisma/client'
import { ITXClientDenyList } from '@prisma/client/runtime/library'

import { prisma } from '../models/PrismaClient'
import * as VmService from './VmService'
import { ErrorMessages } from '../utils/ErrorMessages'

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

  default:
    console.log('Unknown action type', actionType)
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

const generateToken = (size: number = 48): string => {
  return crypto.randomBytes(size).toString('base64url')
}
