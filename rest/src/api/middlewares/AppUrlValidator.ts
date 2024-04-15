import { Request, Response, NextFunction } from 'express'

import * as AppUrlService from '../../services/AppUrlService'
import { ErrorMessages } from '../../utils/ErrorMessages'

export const validateAppUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token

    const appUrl = await AppUrlService.findAppUrl(token)

    // One time URL should be valid, not used and if it has an expiration date, it should not be expired
    if (!appUrl || appUrl.usedAt || (appUrl.expiresAt && appUrl.expiresAt < new Date())) {
      throw new Error(ErrorMessages.AppUrlInvalidOrExpired)
    }

    req.appUrl = appUrl
    next()
  } catch (error) {
    next(error)
  }
}
