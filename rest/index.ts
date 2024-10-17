import './instrument'
import express, { Express } from 'express'
import * as http from 'http'
import dotenv from 'dotenv'
import cors from 'cors'
import * as Sentry from '@sentry/node'
import session from 'express-session'
import RedisStore from 'connect-redis'
import { createClient } from 'redis'
import expressWinston from 'express-winston'

import logger from './src/utils/logger'

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
dotenv.config({path: envFile})

import { initializeSocketIO } from './src/sockets'
import authRoutes from './src/api/routes/authRoutes'
import vmRoutes from './src/api/routes/vmRoutes'
import messageRoutes from './src/api/routes/messageRoute'
import appUrlRoute from './src/api/routes/appUrlRoute'

import { handleError } from './src/api/middlewares/errorHandler'
import { connectToRabbitMQ } from './src/utils/queueUtils'
import './src/cronJobs'


const redisClient = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
})

redisClient
  .connect()
  .then(() => {
    logger.info('Redis connection established')
  })
  .catch(error => {
    logger.error('Redis connection error:', error)
  })

const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'naic:',
  ttl: 24 * 60 * 60,
})


const app: Express = express()
const server: http.Server = http.createServer(app)

initializeSocketIO(server)

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

// Request logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}',
  expressFormat: true,
  colorize: false,
}))

// Error logging
app.use(expressWinston.errorLogger({
  winstonInstance: logger,
}))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/vm', vmRoutes)
app.use('/api/message', messageRoutes)
app.use('/go', appUrlRoute)

// Error handlers
Sentry.setupExpressErrorHandler(app)
app.use(handleError)

connectToRabbitMQ()

server.listen(port, () => {
  logger.info(`⚡️[server]: Server is running at http://localhost:${port}`)
})


