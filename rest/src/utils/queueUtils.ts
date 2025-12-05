import amqp from 'amqplib'
import * as Sentry from '@sentry/node'
import * as MessageQueueService from '../services/messageQueueService'
import logger from './logger'

let connection: amqp.Connection | null = null
export let channel: amqp.Channel | null = null
export let isChannelOpen = false
const rabbitMqUrl = process.env.RABBITMQ_URL_GCP || 'amqp://localhost:5672'

export async function connectToRabbitMQ() {
  try {
    logger.info({message: 'Connecting to RabbitMQ'})
    connection = await amqp.connect(rabbitMqUrl)
    logger.info({message: 'Connected to RabbitMQ'})

    channel = await connection.createConfirmChannel()
    isChannelOpen = true

    connection.on('close', () => {
      isChannelOpen = false
      logger.warn({message: 'Connection to RabbitMQ closed, reconnecting...'})
      reconnect()
    })

    connection.on('error', (err) => {
      logger.error({message: 'RabbitMQ connection error', error: err})
    })

    await MessageQueueService.publishAllPendingMessages()
  } catch (error) {
    logger.error({message: 'Failed to connect to RabbitMQ', error})
    Sentry.captureException(error, {contexts: {rabbitmq: {message: 'Failed to connect to RabbitMQ'}}})
  }
}

function reconnect() {
  setTimeout(connectToRabbitMQ, 5000) // Reconnect after 5 seconds
}

