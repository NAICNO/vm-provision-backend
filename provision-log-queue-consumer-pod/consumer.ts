import axios from 'axios'
import { connect } from 'amqplib'

const VM_PROVISIONING_PROGRESS_QUEUE = 'vm_provisioning_progress'

const RABBITMQ_USER = process.env.RABBITMQ_USER
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD
const RABBITMQ_HOST = 'rabbitmq' // Assuming the RabbitMQ service is named 'rabbitmq'
const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:5672`

const REST_API_URL = 'http://rest-service/api/message/process' // Assuming the REST API service is named 'rest-service'
const AUTH_API_KEY_SECRET = process.env.AUTH_API_KEY_SECRET

interface ProgressMessage {
  vm_id: string
  action: string
  message: any
}

const axiosInstance = axios.create({
  baseURL: REST_API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': AUTH_API_KEY_SECRET,
  },
})


async function startConsumer() {
  try {
    const conn = await connect(RABBITMQ_URL)
    const channel = await conn.createConfirmChannel()
    await channel.assertQueue(VM_PROVISIONING_PROGRESS_QUEUE, {durable: true})

    console.log(' [*] Waiting for messages in %s.', VM_PROVISIONING_PROGRESS_QUEUE)

    await channel.consume(VM_PROVISIONING_PROGRESS_QUEUE, async (message) => {
      if (message) {

        console.log(' [x] Received %s', message.content.toString())

        try {
          const messageString = message.content.toString()
          const progressMessage = JSON.parse(messageString) as ProgressMessage

          const vmId = progressMessage.vm_id
          const action = progressMessage.action
          const tfLogMessage = progressMessage.message

          const result = await axiosInstance.post('', {
            vmId: vmId,
            action: action,
            queueName: VM_PROVISIONING_PROGRESS_QUEUE,
            message: tfLogMessage
          })

          console.log('Message sent!', result.status, vmId)
          // Acknowledge the message
          channel?.ack(message)

        } catch (error) {
          console.error('Error in consuming message:', error)
        }
      }
    }, {
      noAck: false, // Enable message acknowledgments
    })
  } catch (error) {
    console.error('Error in consumer ', error)
  }
}

startConsumer()
