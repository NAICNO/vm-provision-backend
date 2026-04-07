import { Message, MessagePublishStatus, PrismaClient } from '@prisma/client'
import { ITXClientDenyList } from '@prisma/client/runtime/library'

import { channel, connectToRabbitMQ, isChannelOpen } from '../utils/queueUtils'
import { sleep } from '../utils/utils'
import { prisma } from '../models/prismaClient'
import logger from '../utils/logger'

export const publishMessage = async (queueName: string, message: Message) => {
  if (isChannelOpen && channel) {
    try {
      await channel.assertQueue(queueName, {durable: true})
      const sent = channel.sendToQueue(queueName, Buffer.from(message.message),
        {
          persistent: true,
        })
      if (sent) {
        await markMessageAsPublished(message.messageId)
      } else {
        await markMessageAsFailed(message.messageId)
        logger.error({message: 'Send to queue returned false'})
      }
    } catch (error) {
      logger.error({message: 'Failed to send message:', error})
      await markMessageAsFailed(message.messageId)
    }
  } else {
    await connectToRabbitMQ()
  }
}

export const publishAllPendingMessages = async () => {
  const pendingMessages = await getAllPendingMessages()
  for (const message of pendingMessages) {
    await publishMessage(message.queueName, message)
    await sleep(100)
  }
}

export const markMessageAsFailed = async (messageId: string) => {
  return prisma.message.update({
    where: {
      messageId: messageId
    },
    data: {
      status: MessagePublishStatus.FAILED,
      updatedAt: new Date(),
    }
  })
}

const markMessageAsPublished = async (messageId: string) => {
  return prisma.message.update({
    where: {
      messageId: messageId
    },
    data: {
      status: MessagePublishStatus.PUBLISHED,
      updatedAt: new Date(),
    }
  })
}
export const addToMessageQueue = async (
  prisma: Omit<PrismaClient, ITXClientDenyList>,
  queueName: string,
  message: string,
  userId: string,
  vmId: string,
  metadata: any
): Promise<Message> => {
  return prisma.message.create({
    data: {
      queueName: queueName,
      message: message,
      userId: userId,
      vmId: vmId,
      metadata: JSON.stringify(metadata),
      status: MessagePublishStatus.PENDING
    }
  })
}

export const getAllPendingMessages = async (): Promise<Message[]> => {
  return prisma.message.findMany({
    where: {
      OR: [
        {
          status: MessagePublishStatus.PENDING
        },
        {
          status: MessagePublishStatus.FAILED
        }
      ]
    }
  })
}




