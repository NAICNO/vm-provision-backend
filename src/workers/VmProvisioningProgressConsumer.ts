import dotenv from 'dotenv'
import path from 'path'
import axios from 'axios'
import * as Sentry from '@sentry/node'
import { channel, connectToRabbitMQ } from '../utils/QueueUtils'
import { VM_PROVISIONING_PROGRESS_QUEUE } from '../utils/Constants'


dotenv.config({path: path.resolve(__dirname, '../../.env')})

interface ProgressMessage {
  vm_id: string
  message: any
}

const axiosInstance = axios.create({
  baseURL: process.env.CONSUMER_MESSAGE_POST_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': process.env.AUTH_API_KEY_SECRET,
  },
})


async function consume() {
  await connectToRabbitMQ()
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized')
  }
  await channel.assertQueue(VM_PROVISIONING_PROGRESS_QUEUE, {durable: true})
  console.log(`Waiting for messages in queue: ${VM_PROVISIONING_PROGRESS_QUEUE}. To exit press CTRL+C`)
  await channel.consume(VM_PROVISIONING_PROGRESS_QUEUE, async (message) => {
    if (message) {

      try {
        const messageString = message.content.toString()
        const progressMessage = JSON.parse(messageString) as ProgressMessage

        const vmId = progressMessage.vm_id
        const tfLogMessage = progressMessage.message

        const result = await axiosInstance.post('', {
          vmId: vmId,
          queueName: VM_PROVISIONING_PROGRESS_QUEUE,
          message: tfLogMessage
        })

        console.log('Message sent! Result: ', result.data)
        // Acknowledge the message
        channel?.ack(message)

      } catch (error) {
        console.error('Error in consuming message:', error)
      }
    }
  }, {
    noAck: false, // Enable message acknowledgments
  })
}

consume()
  .catch((error) => {
    console.error('Exiting consuming.. Error:', error)
    Sentry.captureException(error,
      {
        contexts:
          {
            rabbitmq: {
              message: 'Error in consuming message'
            }
          }
      })
    process.exit(1)
  })


