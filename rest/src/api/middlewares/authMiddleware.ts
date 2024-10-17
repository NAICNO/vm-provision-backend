import { NextFunction, Request, Response } from 'express'
import * as AuthService from '../../services/authService'
import { REAUTH_TIME_LIMIT_MINUTES } from '../../utils/constants'
import logger from '../../utils/logger'
import { promisify } from 'node:util'

export async function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.idToken || !req.session.user) {
      return res.status(401).json({error: 'Unauthorized'})
    }

    const now = Date.now()

    // Check if access token exists and is expired
    if (!req.session.accessToken || !req.session.accessTokenExpiresAt) {
      return res.status(401).json({error: 'Access token not available'})
    }

    if (now >= req.session.accessTokenExpiresAt) {
      logger.debug('Access token expired, refreshing...', {userId: req.session.user.userId})

      const destroySession = promisify(req.session.destroy).bind(req.session)

      // Check if refresh token is available and not expired
      if (!req.session.refreshToken || !req.session.refreshTokenExpiresAt) {
        await destroySession()
        return res.status(401).json({error: 'Refresh token not available or expired'})
      }

      if (now >= req.session.refreshTokenExpiresAt) {
        await destroySession()
        return res.status(401).json({error: 'Refresh token expired'})
      }

      const {idToken, accessToken, refreshToken} = await AuthService.refreshTokens(req.session.refreshToken)


      // Decode new tokens to get expiration times
      const accessTokenExpiresAt = AuthService.getExpirationOfToken(accessToken) * 1000

      let refreshTokenExpiresAt = req.session.refreshTokenExpiresAt
      if (refreshToken) {
        refreshTokenExpiresAt = AuthService.getExpirationOfToken(refreshToken) * 1000
      }

      // Update session with new tokens and expiration times
      req.session.idToken = idToken
      req.session.accessToken = accessToken
      req.session.accessTokenExpiresAt = accessTokenExpiresAt

      if (refreshToken) {
        req.session.refreshToken = refreshToken
        req.session.refreshTokenExpiresAt = refreshTokenExpiresAt
      }

      logger.debug('Tokens refreshed successfully', {userId: req.session.user.userId})
    }

    next()
  } catch (error) {
    logger.error('Error ensuring authentication', error)
    req.session.destroy(() => {
      return res.status(401).json({error: 'Authentication error'})
    })
  }
}

export function requireReauthentication(req: Request, res: Response, next: NextFunction) {
  const reauthTimeLimit = REAUTH_TIME_LIMIT_MINUTES * 60 * 1000

  if (!req.session.reauthenticatedAt) {
    return res.status(403).json({error: 'Re-authentication required'})
  }

  if (typeof req.session.reauthenticatedAt !== 'number') {
    return res.status(403).json({error: 'Re-authentication timestamp invalid'})
  }

  const timeSinceReauth = Date.now() - req.session.reauthenticatedAt

  if (timeSinceReauth > reauthTimeLimit) {
    return res.status(403).json({error: 'Re-authentication expired'})
  }

  next()
}

export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const receivedApiKey = req.headers['x-api-key'] || ''
    if (Array.isArray(receivedApiKey)) {
      const apiKey = receivedApiKey[0]
      await AuthService.validateApiKey(apiKey)
    } else {
      await AuthService.validateApiKey(receivedApiKey)
    }
    next()
  } catch (error) {
    next(error)
  }
}
