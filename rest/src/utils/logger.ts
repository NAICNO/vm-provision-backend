import { createLogger, format, transports } from 'winston'
import { LoggingWinston } from '@google-cloud/logging-winston'

const {colorize, combine, timestamp, printf, errors, json} = format

const env = process.env.NODE_ENV || 'development'

const myFormat = printf(({level, message, timestamp, stack}) => {
  return `${timestamp} [${level}] ${stack || message}`
})

const loggingWinston = new LoggingWinston( {
  prefix: env === 'development' ? 'local-dev' : undefined,
})


// Create a Winston logger instance
const logger = createLogger({
  level: env === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp(),
    errors({stack: true}), // Include stack traces
    env === 'development' ? combine(colorize(), myFormat) : json() // Use JSON format in production
  ),
  defaultMeta: {service: 'rest'},
  transports: [
    new transports.Console(),
    loggingWinston,
  ],
})

// Handle uncaught exceptions
logger.exceptions.handle(
  new transports.Console(),
  loggingWinston
)

// Handle unhandled rejections
logger.rejections.handle(
  new transports.Console(),
  loggingWinston
)

export default logger
