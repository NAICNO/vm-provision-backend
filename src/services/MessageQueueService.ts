import * as Sentry from '@sentry/node'
import { channel, connectToRabbitMQ, isChannelOpen } from '../utils/QueueUtils'
import { sleep } from '../utils/Utils'
import { prisma } from '../models/PrismaClient'
import { MessagePublishStatus } from '../utils/MessagePublishStatus'
import { Message, PrismaClient } from '@prisma/client'
import { ITXClientDenyList } from '@prisma/client/runtime/library'

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
        Sentry.captureException(new Error('Send to queue returned false'),
          {
            contexts: {rabbitmq: {message: 'Error in publishing message'}}
          })
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      Sentry.captureException(error, {contexts: {rabbitmq: {message: 'Error in publishing message'}}})
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




