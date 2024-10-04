import './instrument'
import express, { Express } from 'express'
import * as http from 'http'
import dotenv from 'dotenv'
import cors from 'cors'
import * as Sentry from '@sentry/node'
import session from 'express-session'
import RedisStore from 'connect-redis'
import { createClient } from 'redis'

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
dotenv.config({path: envFile})

import { initializeSocketIO } from './src/sockets'
import authRoutes from './src/api/routes/AuthRoutes'
import vmRoutes from './src/api/routes/VmRoutes'
import messageRoutes from './src/api/routes/MessageRoute'
import appUrlRoute from './src/api/routes/AppUrlRoute'

import { handleError } from './src/api/middlewares/ErrorHandler'
import { connectToRabbitMQ } from './src/utils/QueueUtils'

import  './src/cronJobs'

const redisClient = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
})

redisClient
  .connect()
  .then(() => {
    console.log('Redis connection established')
  })
  .catch(error => {
    console.error('Redis connection error:', error)
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
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})


