import { generateKeyPairSync, KeyPairSyncResult } from 'crypto'
import sshpk from 'sshpk'

import { prisma } from '../models/PrismaClient'
import { ErrorMessages } from '../utils/ErrorMessages'
import { VmPublicKey } from '@prisma/client'
import * as Sentry from '@sentry/node'

export const getAllUserSshKeys = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }
  return prisma.vmPublicKey.findMany({
    where: {
      userId: userId,
    },
  })
}

export const createSSHKeyPair = async (userId: string | undefined, name: string) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }

  const {publicKey, privateKey} = generateKeyPair()

  const sshPublicKey = convertPemToSSH(publicKey)

  const stored = await prisma.vmPublicKey.create({
    data: {
      name: name,
      publicKey: sshPublicKey.toString(),
      userId: userId,
    },
  })

  return {
    keyId: stored.keyId,
    privateKey: privateKey,
  }

}

export const findPublicKey = async (publicKeyId: string): Promise<VmPublicKey> => {
  try {
    return await prisma.vmPublicKey.findUniqueOrThrow({
      where: {
        keyId: publicKeyId,
      },
    })
  } catch (e) {
    const error = new Error(ErrorMessages.InternalServerError)
    Sentry.captureException(error, {
      contexts: {
        message: {
          sshKeyId: publicKeyId,
          message: 'Public key not found'
        }
      }
    })
    throw error
  }
}

const generateKeyPair = (): KeyPairSyncResult<string, string> => {
  return generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })
}

const convertPemToSSH = (pemKey: string) => {
  const key = sshpk.parseKey(pemKey, 'pem')
  return key.toString('ssh')
}
