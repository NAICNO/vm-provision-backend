import { createLogger, format, transports } from 'winston'

const {colorize, combine, timestamp, printf, errors, json} = format

const env = process.env.NODE_ENV || 'development'

const devFormat = printf(({level, message, timestamp, stack}) => {
  return `${timestamp} [${level}] ${stack || message}`
})

const transportsList = [
  new transports.Console(),
]

// Create a Winston logger instance
const logger = createLogger({
  level: env === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp(),
    errors({stack: true}), // Include stack traces
    env === 'development' ? combine(colorize(), devFormat) : json() // Use JSON format in production
  ),
  defaultMeta: {service: 'rest'},
  transports: transportsList,
})

// Handle uncaught exceptions
logger.exceptions.handle(...transportsList)


// Handle unhandled rejections
logger.rejections.handle(...transportsList)

export default logger
