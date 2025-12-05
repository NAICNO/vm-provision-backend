import { createLogger, format, transports } from 'winston'

const {colorize, combine, timestamp, printf, errors, json} = format

const env = process.env.NODE_ENV || 'development'

// Custom format to ensure error objects are properly serialized
const errorSerializer = format((info) => {
  if (info.error instanceof Error) {
    info.error = {
      message: info.error.message,
      stack: info.error.stack,
      name: info.error.name,
    }
  }
  return info
})

// Development format: human-readable with colors
const devFormat = printf(({level, message, timestamp, stack, ...meta}) => {
  // Filter out empty meta
  const filteredMeta = Object.entries(meta).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && key !== 'meta') {
      acc[key] = value
    } else if (key === 'meta' && typeof value === 'object' && Object.keys(value as object).length > 0) {
      Object.assign(acc, value)
    }
    return acc
  }, {} as Record<string, unknown>)

  const hasMetaData = Object.keys(filteredMeta).length > 0
  const metaString = hasMetaData ? `\n${JSON.stringify(filteredMeta, null, 2)}` : ''
  
  return `${timestamp} [${level}] ${stack || message}${metaString}`
})

// Production format: structured JSON for GCP Cloud Logging
const gcpFormat = format((info) => {
  // Map Winston levels to GCP severity
  const severityMap: Record<string, string> = {
    error: 'ERROR',
    warn: 'WARNING',
    info: 'INFO',
    debug: 'DEBUG',
  }
  
  return {
    ...info,
    severity: severityMap[info.level] || 'DEFAULT',
  }
})

const transportsList = [
  new transports.Console(),
]

// Create a Winston logger instance
const logger = createLogger({
  level: env === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp(),
    errorSerializer(),
    errors({stack: true}),
    env === 'development' 
      ? combine(colorize(), devFormat) 
      : combine(gcpFormat(), json())
  ),
  defaultMeta: env === 'production' ? {service: 'rest-api'} : undefined,
  transports: transportsList,
})

// Handle uncaught exceptions
logger.exceptions.handle(...transportsList)

// Handle unhandled rejections
logger.rejections.handle(...transportsList)

export default logger
