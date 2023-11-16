import { Request, Response } from 'express'
import * as AuthService from '../../services/AuthService'

export const getTokens = async (req: Request, res: Response) => {

  const code = typeof req.query.code === 'string' ? req.query.code : ''
  const nonce = typeof req.query.nonce === 'string' ? req.query.nonce : ''

  const tokens = await AuthService.fetchTokens(code, nonce)
  res.json({...tokens})
}

export const refreshTokens = async (req: Request, res: Response) => {
  const refreshToken = typeof req.query.refreshToken === 'string' ? req.query.refreshToken : ''
  const scope = typeof req.query.scope === 'string' ? req.query.scope : ''
  const tokens = await AuthService.refreshTokens(refreshToken, scope)
  res.json({...tokens})
}
