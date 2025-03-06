import { Client, Issuer } from 'openid-client'

const discoveryUrl = process.env.SIGMA_DISCOVERY_URL!
const clientId = process.env.SIGMA_CLIENT_ID!
const clientSecret = process.env.SIGMA_CLIENT_SECRET!
const redirectUri = process.env.SIGMA_REDIRECT_URI!

let keycloakIssuer: Issuer | null = null
let client: Client | null = null

export const initializeAuthClient = async () => {
  try {
    if (!discoveryUrl || !clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing required environment variables for authentication')
    }

    keycloakIssuer = await Issuer.discover(discoveryUrl)
    client = new keycloakIssuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [redirectUri], // Must match your Keycloak settings
      response_types: ['code'],
    })

    console.log('Authentication client initialized successfully')
    console.log('Discovery config:', keycloakIssuer.issuer)
    console.log('redirectUri:', redirectUri)
  } catch (error) {
    console.error('Failed to initialize auth client:', error)
  }
}

export { client }
