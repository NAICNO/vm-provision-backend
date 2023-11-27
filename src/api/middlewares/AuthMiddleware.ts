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
