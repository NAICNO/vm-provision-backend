import * as amqp from 'amqplib'
import * as MessageQueueService from '../services/messageQueueService'
import logger from './logger'
import { ChannelModel } from 'amqplib'

export let channel: amqp.ConfirmChannel | null = null
export let isChannelOpen = false
const rabbitMqUrl = process.env.RABBITMQ_URL_GCP || 'amqp://localhost:5672'

export async function connectToRabbitMQ() {
  try {
    logger.info({message: 'Connecting to RabbitMQ'})
    const channelModel: ChannelModel = await amqp.connect(rabbitMqUrl)
    logger.info({message: 'Connected to RabbitMQ'})

    channel = await channelModel.createConfirmChannel()
    isChannelOpen = true

    channelModel.on('close', () => {
      isChannelOpen = false
      logger.warn({message: 'Connection to RabbitMQ closed, reconnecting...'})
      reconnect()
    })

    channelModel.on('error', (err) => {
      logger.error({message: 'RabbitMQ connection error', error: err})
    })

    await MessageQueueService.publishAllPendingMessages()
  } catch (error) {
    logger.error({message: 'Failed to connect to RabbitMQ', error})
  }
}

function reconnect() {
  setTimeout(connectToRabbitMQ, 5000) // Reconnect after 5 seconds
}
