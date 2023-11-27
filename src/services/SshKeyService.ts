import { prisma } from '../models/PrismaClient'
import { ErrorMessages } from '../utils/ErrorMessages'
import { generateKeyPairSync, KeyPairSyncResult } from 'crypto'

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

  const {publicKey, privateKey} = generateSshKeyPair()

  const stored = await prisma.vmPublicKey.create({
    data: {
      name: name,
      publicKey: publicKey,
      userId: userId,
    },
  })

  return {
    keyId: stored.keyId,
    privateKey: privateKey,
  }

}

const generateSshKeyPair = (): KeyPairSyncResult<string, string> => {
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

