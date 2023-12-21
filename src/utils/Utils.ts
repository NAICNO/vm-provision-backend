// Get first name and last name from name
import { Express } from 'express'
import * as Sentry from '@sentry/node'
import { ProfilingIntegration } from '@sentry/profiling-node'

export const getFirstName = (name: string) => {
  const nameArray = name.split(' ')
  return nameArray[0] || ''
}
export const getLastName = (name: string) => {
  const nameArray = name.split(' ')
  return nameArray[nameArray.length - 1] || ''
}

export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const initializeSentry = (app: Express) => {
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
}
