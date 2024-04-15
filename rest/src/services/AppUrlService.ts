import * as crypto from 'crypto'
import { prisma } from '../models/PrismaClient'
import { UrlActionType } from '../utils/UrlActionType'
import { AppUrl, PrismaClient } from '@prisma/client'
import * as VmService from './VmService'
import { ErrorMessages } from '../utils/ErrorMessages'
import { ITXClientDenyList } from '@prisma/client/runtime/library'

export const createAppUrl = async (tx: Omit<PrismaClient, ITXClientDenyList>, action: UrlActionType, metadata: any): Promise<AppUrl> => {
  return tx.appUrl.create({
    data: {
      actionType: action,
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

  const actionType = appUrl.actionType

  switch (actionType) {
  case UrlActionType.NOTIFY_VM_INITIALIZE_START:
  case UrlActionType.NOTIFY_VM_INITIALIZE_COMPLETE: {
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
