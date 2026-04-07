import { generateKeyPairSync, KeyPairSyncResult } from 'crypto'
import sshpk from 'sshpk'

import { prisma } from '../models/prismaClient'
import { ErrorMessages } from '../utils/errorMessages'
import { VmPublicKey } from '@prisma/client'

export const getAllUserSshKeys = async (userId: string | undefined) => {
  return prisma.vmPublicKey.findMany({
    where: {
      userId: userId,
    },
  })
}

export const createSSHKeyPair = async (userId: string, name: string) => {

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
    throw new Error(ErrorMessages.InternalServerError)
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
