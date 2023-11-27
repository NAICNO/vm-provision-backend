import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import * as Sentry from '@sentry/node'
import { ProfilingIntegration } from '@sentry/profiling-node'

import { generateKeyPair } from 'crypto'

import authRoutes from './src/api/routes/AuthRoutes'
import vmRoutes from './src/api/routes/VmRoutes'

import { handleError } from './src/api/middlewares/ErrorHandler'

dotenv.config()

const app: Express = express()

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({tracing: true}),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({app}),
    new ProfilingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
})

app.use(Sentry.Handlers.requestHandler())
app.use(Sentry.Handlers.tracingHandler())
app.use(cors())
app.use(express.json())

const port = process.env.PORT || 3000

app.use('/api/auth', authRoutes)
app.use('/api/vm', vmRoutes)


app.get('/', (req: Request, res: Response) => {
  res.send('Hello World')
})

app.use(Sentry.Handlers.errorHandler())
app.use(handleError)

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})


