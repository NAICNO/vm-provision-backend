import * as client from 'openid-client'
import { buildAuthorizationUrl } from 'openid-client'

const discoveryUrl = process.env.SIGMA_DISCOVERY_URL!
const clientId = process.env.SIGMA_CLIENT_ID!
const clientSecret = process.env.SIGMA_CLIENT_SECRET!
const redirectUri = process.env.SIGMA_REDIRECT_URI!

let config: client.Configuration

export const initializeAuthClient = async () => {
  try {
    if (!discoveryUrl || !clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing required environment variables for authentication')
    }
    const server: URL = new URL(discoveryUrl)

    // v6: provide client metadata and explicit client authentication method
    // Allow insecure (HTTP) in local/dev when discovery URL is not HTTPS
    const allowInsecure = server.protocol === 'http:'

    config = await client.discovery(
      server,
      clientId,
      { client_secret: clientSecret },
      client.ClientSecretPost(clientSecret),
      allowInsecure ? { execute: [client.allowInsecureRequests] } : undefined,
    )

    if (allowInsecure) {
      client.allowInsecureRequests(config)
    }

    console.log('Authentication client initialized successfully')
    console.log('Discovery config:', config.serverMetadata().issuer)
  } catch (error) {
    console.error('Failed to initialize auth client:', error)
  }
}

export const buildLoginUrl = () => {

  if (!config) throw new Error('Auth client not initialized')

  const authorizationEndpoint = config.serverMetadata().authorization_endpoint
  if (!authorizationEndpoint) throw new Error('authorization_endpoint is missing from metadata')

  const params: URLSearchParams = new URLSearchParams({
    redirect_uri: redirectUri,
    scope: 'openid profile email organization',
    response_type: 'code',
  })

  const url = buildAuthorizationUrl(config, params)

  return url.toString()
}

export { config }
