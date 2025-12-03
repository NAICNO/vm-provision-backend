import './instrument'
import express, { Express } from 'express'
import * as http from 'http'
import dotenv from 'dotenv'
import { randomUUID } from 'crypto'

const env = process.env.NODE_ENV || 'development'
const envFile = `.env.${env}`
dotenv.config({path: envFile})

import cors from 'cors'
import * as Sentry from '@sentry/node'
import session from 'express-session'
import RedisStore from 'connect-redis'
import { createClient } from 'redis'
import expressWinston from 'express-winston'

import logger from './src/utils/logger'

import { initializeSocketIO } from './src/sockets'
import authRoutes from './src/api/routes/authRoutes'
import vmRoutes from './src/api/routes/vmRoutes'
import userRoutes from './src/api/routes/userRoutes'
import messageRoutes from './src/api/routes/messageRoute'
import appUrlRoute from './src/api/routes/appUrlRoute'

import { handleError } from './src/api/middlewares/errorHandler'
import { connectToRabbitMQ } from './src/utils/queueUtils'
import { initializeAuthClient } from './src/utils/authUtils'
import './src/cronJobs'

const redisClient = createClient({
  url: process.env.REDIS_URL_GCP,
  password: process.env.REDIS_PASSWORD,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 20) { // Increased from 10 to 20 attempts
        logger.error('Redis reconnection failed after 20 attempts')
        return new Error('Too many reconnection attempts')
      }
      // Fast initial reconnects (100ms, 200ms, 400ms...), max 5s between attempts
      const delay = Math.min(100 * Math.pow(2, retries), 5000)
      logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries + 1})`)
      return delay
    },
    connectTimeout: 15000, // Increased from 10s to 15s for slower networks
    keepAlive: 30000, // Increased from 5s to 30s to match Redis server tcp-keepalive
  },
  // Keep offline queue enabled so commands during reconnection are queued
  disableOfflineQueue: false,
})

// Handle Redis connection events
redisClient.on('connect', () => {
  logger.info('Redis client connected')
})

redisClient.on('ready', () => {
  logger.info('Redis client ready to use')
})

redisClient.on('error', (error) => {
  logger.error({message: 'Redis client error:', error})
  // Don't crash the app on Redis errors
})

redisClient.on('reconnecting', () => {
  logger.warn('Redis client reconnecting...')
})

redisClient.on('end', () => {
  logger.warn('Redis connection closed')
})

// Initial connection
redisClient
  .connect()
  .then(() => {
    logger.info('Redis connection established')
  })
  .catch(error => {
    logger.error({message: 'Redis initial connection error:', error})
    // Don't crash on initial connection failure - will retry
  })

const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'naic:',
  ttl: 24 * 60 * 60,
})


const app: Express = express()
const server: http.Server = http.createServer(app)

initializeSocketIO(server)

// Add request ID to all requests
app.use((req, res, next) => {
  req.id = randomUUID()
  res.setHeader('X-Request-ID', req.id)
  next()
})

app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}))
app.use(express.json())
app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    }
  })
)

const port = process.env.PORT || 3000

// Request logging - skip health check endpoints
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}',
  expressFormat: true,
  colorize: false,
  dynamicMeta: (req) => ({
    requestId: req.id,
    userId: req.session?.user?.userId,
    ip: req.ip,
    userAgent: req.get('user-agent')
  }),
  ignoreRoute: (req) => {
    return req.path === '/health' || req.path === '/ready'
  }
}))

// Error logging
app.use(expressWinston.errorLogger({
  winstonInstance: logger,
}))

// Middleware to restrict health endpoints to internal access only
const internalOnlyMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIP = req.ip || req.socket.remoteAddress || ''

  // Allow localhost and internal cluster IPs (10.x.x.x for GKE)
  const isInternal = clientIP === '127.0.0.1' ||
    clientIP === '::1' ||
    clientIP === '::ffff:127.0.0.1' ||
    clientIP.startsWith('10.') ||
    clientIP.startsWith('::ffff:10.')

  if (isInternal) {
    next()
  } else {
    res.status(403).json({error: 'Forbidden'})
  }
}

// Health check endpoint - internal only
app.get('/health', internalOnlyMiddleware, (req, res) => {
  res.status(200).json({status: 'ok', timestamp: new Date().toISOString()})
})

// Readiness check endpoint - internal only, checks dependencies
app.get('/ready', internalOnlyMiddleware, async (req, res) => {
  try {
    // Instead of checking isReady flag, try to ping Redis directly
    // This allows for brief reconnection periods without failing readiness
    const pingPromise = redisClient.ping()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis ping timeout')), 2000)
    )

    await Promise.race([pingPromise, timeoutPromise])

    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() })
  } catch (error) {
    logger.error({
      message: 'Readiness check failed',
      error,
      isOpen: redisClient.isOpen,
      isReady: redisClient.isReady,
      requestId: req.id
    })
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/vm', vmRoutes)
app.use('/api/user', userRoutes)
app.use('/api/message', messageRoutes)
app.use('/go', appUrlRoute)

// Error handlers
Sentry.setupExpressErrorHandler(app)
app.use(handleError)

initializeAuthClient().catch(error => {
  logger.error({message: 'Failed to initialize auth client', error})
})

connectToRabbitMQ()

server.listen(port, () => {
  logger.info(`⚡️[server]: Server is running at http://localhost:${port}`)
})

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`)

  try {
    // Close HTTP server (stop accepting new connections)
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          logger.error({message: 'Error closing HTTP server:', error: err})
          reject(err)
        } else {
          logger.info('HTTP server closed')
          resolve()
        }
      })
    })

    // Close Redis connection
    if (redisClient.isOpen) {
      await redisClient.quit()
      logger.info('Redis connection closed')
    }

    // Close RabbitMQ connection (if you have a closeRabbitMQ function)
    // await closeRabbitMQ()

    logger.info('Graceful shutdown completed')
    process.exit(0)
  } catch (error) {
    logger.error({message: 'Error during graceful shutdown:', error})
    process.exit(1)
  }
}

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions (after all other setup)
process.on('uncaughtException', (error: Error) => {
  logger.error({message: 'Uncaught exception:', error})
  Sentry.captureException(error)
  // Give Sentry time to send the error, then exit
  setTimeout(() => {
    process.exit(1)
  }, 2000)
})

process.on('unhandledRejection', (reason: any) => {
  logger.error({message: 'Unhandled rejection:', error: reason})
  Sentry.captureException(reason)
})


