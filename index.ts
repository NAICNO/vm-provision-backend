import express, { Express } from 'express'
import * as http from 'http'
import dotenv from 'dotenv'
import cors from 'cors'
import * as Sentry from '@sentry/node'

import { initializeSocketIO } from './src/sockets'

import authRoutes from './src/api/routes/AuthRoutes'
import vmRoutes from './src/api/routes/VmRoutes'
import messageRoutes from './src/api/routes/MessageRoute'

import { handleError } from './src/api/middlewares/ErrorHandler'
import { connectToRabbitMQ } from './src/utils/QueueUtils'
import { initializeSentry } from './src/utils/Utils'

dotenv.config()

const app: Express = express()
const server: http.Server = http.createServer(app)

initializeSocketIO(server)

initializeSentry(app)

app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())
app.use(cors())
app.use(express.json())

const port = process.env.PORT || 3000

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/vm', vmRoutes)
app.use('/api/message', messageRoutes)

// Error handlers
app.use(Sentry.Handlers.errorHandler())
app.use(handleError)

connectToRabbitMQ()

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})


