import { NextFunction, Request, Response } from 'express'
import * as AuthService from '../../services/AuthService'

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'] || ''
  req.username = AuthService.validateAccessToken(authHeader)
  next()
}
