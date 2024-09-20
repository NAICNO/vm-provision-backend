import { Request, Response, NextFunction } from 'express'
import { ErrorMessages } from '../../utils/ErrorMessages'

export const handleError = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log('Error - Middleware', err)
  switch (err.message) {
  case ErrorMessages.TokenSecretNotProvided:
    res.status(500).json({message: err.message})
    break
  case ErrorMessages.TokenNotProvided:
    res.status(401).json({message: err.message})
    break
  case ErrorMessages.TokenExpired:
    res.status(401).json({message: err.message})
    break
  case ErrorMessages.TokenInvalid:
    res.status(401).json({message: err.message})
    break
  case ErrorMessages.TokenRefreshFailed:
    res.status(401).json({message: err.message})
    break
  case ErrorMessages.TokenCannotBeObtained:
    res.status(403).json({message: err.message})
    break
  case ErrorMessages.UserNotFound:
    res.status(404).json({message: err.message})
    break
  case ErrorMessages.UserNotAuthorized:
    res.status(401).json({message: err.message})
    break
  case ErrorMessages.ApiKeyNotProvided:
    res.status(401).json({message: err.message})
    break
  case ErrorMessages.CannotCreateVmDueToServerError:
    res.status(503).json({message: err.message})
    break
  case ErrorMessages.AppUrlInvalidOrExpired:
    res.status(404).json({message: err.message})
    break
  default:
    res.status(500).json({message: ErrorMessages.InternalServerError})
  }
}
