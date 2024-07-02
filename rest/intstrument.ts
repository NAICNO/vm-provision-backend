import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: 'https://fc9eaef82cfe23a35ddc2f3dc5f31249@o4506257290362880.ingest.us.sentry.io/4506257292132352',
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
})
