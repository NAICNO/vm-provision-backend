import { Request } from 'express'
import * as client from 'openid-client'

import { ErrorMessages } from '../utils/errorMessages'
import { buildLoginUrl, config } from '../utils/authUtils'
import logger from '../utils/logger'

export const getLoginUrl = async () => {
  return buildLoginUrl()
}

export type SessionToken = client.TokenEndpointResponse & {
  // optional helpers that may be present
  expired?: () => boolean
  claims?: () => any
  // we may add our own timestamp to compute expiry when helper is absent
  _fetchedAt?: number
}

export const fetchTokens = async (req: Request): Promise<SessionToken> => {
  if (!config) throw new Error('Auth client not initialized')

  // Build the current URL from the incoming Express request
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol
  const host = req.get('host')
  const currentUrl = new URL(`${proto}://${host}${req.originalUrl}`)

  // Exchange the authorization code for tokens
  const token = await client.authorizationCodeGrant(config, currentUrl)
  // record fetch time for fallback expiry checks
  ;(token as SessionToken)._fetchedAt = Date.now()
  return token as SessionToken
}

export const getUserInfo = async (accessToken: string, expectedSub?: string) => {
  if (!config) throw new Error('Auth client not initialized')
  // If expectedSub is not provided, skip subject check
  const subject = expectedSub ?? client.skipSubjectCheck
  return client.fetchUserInfo(config, accessToken, subject)
}

export const checkTokenExpiry = (sessionToken?: SessionToken): boolean => {
  if (!sessionToken) return true
  if (typeof sessionToken.expired === 'function') {
    try { return !!sessionToken.expired() } catch {
      logger.error('Error checking token expiry using expired() method, falling back to manual check')
    }
  }
  // Fallback: compute using expires_in and when it was fetched
  const fetchedAt = sessionToken._fetchedAt ?? 0
  const expiresInSec = sessionToken.expires_in as number | undefined
  if (fetchedAt && typeof expiresInSec === 'number') {
    const expiresAtMs = fetchedAt + expiresInSec * 1000 - 5_000 // 5s skew
    return Date.now() >= expiresAtMs
  }
  // As a last resort, consider token expired if we can't determine
  return true
}

export const refreshTokens = async (tokenSet: SessionToken): Promise<SessionToken> => {
  if (!config) throw new Error('Auth client not initialized')
  if (!tokenSet.refresh_token) throw new Error('Missing refresh token')

  const refreshed = await client.refreshTokenGrant(config, tokenSet.refresh_token)
  ;(refreshed as SessionToken)._fetchedAt = Date.now()
  return refreshed as SessionToken
}

export const validateApiKey = async (apiKey: string) => {
  if (!apiKey) {
    throw new Error(ErrorMessages.ApiKeyNotProvided)
  }

  const apiKeySecret = process.env.AUTH_API_KEY_SECRET
  if (!apiKeySecret) {
    throw new Error(ErrorMessages.InternalServerError)
  }

  if (apiKey !== apiKeySecret) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }
}

export const getLogoutUrl = (idToken: string) => {
  if (!config) throw new Error('Auth client not initialized')
  const url = client.buildEndSessionUrl(config, {
    id_token_hint: idToken,
    post_logout_redirect_uri: process.env.SIGMA_LOGOUT_REDIRECT_URI!,
  })
  return url.toString()
}
