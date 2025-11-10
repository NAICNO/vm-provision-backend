import { Cron } from 'croner'
import * as MessageQueueService from '../services/messageQueueService'
import logger from '../utils/logger'

/**
 * Cron job to publish pending messages from the outbox pattern to RabbitMQ.
 * Runs every 5 seconds to ensure messages don't get stuck in the database.
 * 
 * This implements the transactional outbox pattern:
 * 1. Messages are first saved to the database (PENDING)
 * 2. This cron picks them up and publishes to RabbitMQ
 * 3. On success, marks them as PUBLISHED
 * 4. On failure, marks them as FAILED for retry
 */
const publishPendingMessagesJob = new Cron('*/5 * * * * *', async () => {
  try {
    logger.debug('[Cron] Publishing pending messages to RabbitMQ')
    await MessageQueueService.publishAllPendingMessages()
  } catch (error) {
    logger.error({
      message: '[Cron] Error publishing pending messages',
      error,
    })
  }
})

export default publishPendingMessagesJob
