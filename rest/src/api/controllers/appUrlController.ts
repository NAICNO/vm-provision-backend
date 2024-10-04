import { Request, Response } from 'express'
import * as AppUrlService from '../../services/appUrlService'

export const handleAppUrl = async (req: Request, res: Response) => {
  const appUrl = req.appUrl
  if (!appUrl) {
    return res.status(404).json({message: 'Invalid or expired URL'})
  } else {
    await AppUrlService.handleAppUrl(appUrl)
    res.status(200).json({message: 'URL handled'})
  }
}
