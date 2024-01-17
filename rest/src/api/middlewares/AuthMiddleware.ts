import { NextFunction, Request, Response } from 'express'
import * as AuthService from '../../services/AuthService'

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'] || ''
    req.userProfile = await AuthService.validateAccessToken(authHeader)
    next()
  } catch (error) {
    next(error)
  }
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
