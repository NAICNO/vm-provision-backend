import { createLogger, format, transports } from 'winston'

const {combine, timestamp, errors, json} = format

const transportsList = [
  new transports.Console(),
]

// Create a Winston logger instance
const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    errors({stack: true}), // Include stack traces
    json() // Use JSON format in production
  ),
  defaultMeta: {pod: 'provision-request-queue-consumer-pod'},
  transports: transportsList,
})

// Handle uncaught exceptions
logger.exceptions.handle(...transportsList)


// Handle unhandled rejections
logger.rejections.handle(...transportsList)

export default logger
