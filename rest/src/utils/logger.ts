import { createLogger, format, transports } from 'winston'

const {colorize, combine, timestamp, printf, errors, json, prettyPrint} = format

const env = process.env.NODE_ENV || 'development'

const devFormat = printf(({level, message, timestamp, stack, ...meta}) => {

  let isMetaEmpty = false
  if(Object.keys(meta).length === 0) {
    isMetaEmpty = true
  } else if (Object.keys(meta).includes('meta') && (Object.keys(meta['meta'] as object).length === 0)) {
    isMetaEmpty = true
  }

  const metaString = isMetaEmpty ? '' : JSON.stringify(meta, null, 2)
  return `${timestamp} [${level}] ${stack || message}${metaString ? `\n${metaString}` : ''}`
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
    env === 'development' ? combine(prettyPrint(), colorize(), devFormat) : json() // Use JSON format in production
  ),
  defaultMeta: env === 'production' ? {service: 'rest'} : undefined,
  transports: transportsList,
})

// Handle uncaught exceptions
logger.exceptions.handle(...transportsList)


// Handle unhandled rejections
logger.rejections.handle(...transportsList)

export default logger
