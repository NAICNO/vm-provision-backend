import amqp from 'amqplib'
import * as Sentry from '@sentry/node'
import * as MessageQueueService from '../services/messageQueueService'
import logger from './logger'

let connection: amqp.ChannelModel | null = null
export let channel: amqp.Channel | null = null
export let isChannelOpen = false
const rabbitMqUrl = process.env.RABBITMQ_URL_GCP || 'amqp://localhost:5672'

export async function connectToRabbitMQ() {
  try {
    logger.info('Connecting to RabbitMQ...')
    connection = await amqp.connect(rabbitMqUrl)
    logger.info('Connected to RabbitMQ!')

    channel = await connection.createConfirmChannel()
    isChannelOpen = true

    connection.on('close', () => {
      isChannelOpen = false
      logger.error('Connection to RabbitMQ closed! Reconnecting...')
      reconnect()
    })

    connection.on('error', (err) => {
      logger.error('RabbitMQ Connection Error:', err)
    })

    await MessageQueueService.publishAllPendingMessages()
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ:', error)
    Sentry.captureException(error, {contexts: {rabbitmq: {message: 'Failed to connect to RabbitMQ'}}})
  }
}

function reconnect() {
  setTimeout(connectToRabbitMQ, 5000) // Reconnect after 5 seconds
}
