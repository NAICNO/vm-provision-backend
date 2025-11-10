import { NextFunction, Request, Response } from 'express'
import { TokenSet } from 'openid-client'

import * as AuthService from '../../services/authService'
import logger from '../../utils/logger'

export async function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Check if session exists at all
  if (!req.session) {
    logger.error({message: 'Session object is undefined', requestId: req.id, url: req.url})
    return res.status(401).json({error: 'Session not initialized - please log in'})
  }

  if (!req.session.tokenSet) {
    // No tokens present; user is not authenticated
    return res.status(401).json({error: 'Unauthorized'})
  }

  // Check if user data exists in session
  if (!req.session.user) {
    // Token exists but user data is missing - invalid session state
    logger.error({message: 'Session has token but missing user data', sessionId: req.sessionID})
    req.session.destroy(() => {
      return res.status(401).json({error: 'Invalid session - please log in again'})
    })
    return
  }

  // Rehydrate the TokenSet instance from the stored plain object
  const tokenSet = new TokenSet(req.session.tokenSet)

  // Check if the access token is expired
  if (tokenSet.expired()) {
    try {
      // Attempt to refresh the token set using the refresh token
      // 'client' should be your openid-client instance that can perform the refresh operation.
      const refreshedTokenSet = await AuthService.refreshTokens(tokenSet)
      logger.debug({message: 'Tokens refreshed successfully', userId: req.session?.user?.userId})
      req.session.tokenSet = refreshedTokenSet
    } catch (err) {
      // If the refresh fails (perhaps the refresh token is expired or invalid),
      // clear the session and redirect to the login page.
      logger.error({message: 'Error ensuring authentication', err})
      req.session.destroy(() => {
        return res.status(401).json({error: 'Authentication error'})
      })
      return
    }
  }

  // If we got here, the token is valid (or has been refreshed successfully)
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user?.userType.includes('ADMIN')) {
    return res.status(403).json({error: 'Unauthorized'})
  }
  next()
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user?.userType.includes('SUPER_ADMIN')) {
    return res.status(403).json({error: 'Unauthorized'})
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
