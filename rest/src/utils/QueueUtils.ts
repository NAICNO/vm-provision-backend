import amqp from 'amqplib'
import * as Sentry from '@sentry/node'
import * as MessageQueueService from '../services/MessageQueueService'

let connection: amqp.Connection | null = null
export let channel: amqp.Channel | null = null
export let isChannelOpen = false
const rabbitMqUrl = process.env.RABBITMQ_URL_GCP || 'amqp://localhost:5672'

export async function connectToRabbitMQ() {
  try {
    console.log('Connecting to RabbitMQ...')
    connection = await amqp.connect(rabbitMqUrl)
    console.log('RabbitMQ connection established')

    channel = await connection.createConfirmChannel()
    isChannelOpen = true

    connection.on('close', () => {
      isChannelOpen = false
      console.error('Connection to RabbitMQ closed! Reconnecting...')
      reconnect()
    })

    connection.on('error', (err) => {
      console.error('RabbitMQ Connection Error:', err)
    })

    await MessageQueueService.publishAllPendingMessages()
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error)
    Sentry.captureException(error, {contexts: {rabbitmq: {message: 'Failed to connect to RabbitMQ'}}})
  }
}

function reconnect() {
  setTimeout(connectToRabbitMQ, 5000) // Reconnect after 5 seconds
}

