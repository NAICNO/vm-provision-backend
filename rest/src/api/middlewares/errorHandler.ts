import { Request, Response, NextFunction } from 'express'
import { ErrorMessages } from '../../utils/errorMessages'
import logger from '../../utils/logger'

export const handleError = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({message: 'Error - Middleware', err})
  switch (err.message) {
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
  case ErrorMessages.UserNotAuthorized:
    res.status(401).json({message: err.message})
    break
  case ErrorMessages.ApiKeyNotProvided:
    res.status(401).json({message: err.message})
    break
  case ErrorMessages.UserDisabled:
    res.status(403).json({message: err.message, route: 'profile-status', routeParam: {status: 'disabled'}})
    break
  case ErrorMessages.UserPendingDeletion:
    res.status(403).json({message: err.message, route: 'profile-status', routeParam: {status: 'pending-deletion'}})
    break
  case ErrorMessages.UserIsNotMemberOfProject:
    res.status(403).json({message: err.message, route: 'profile-status', routeParam: {status: 'not-a-member'}})
    break
  case ErrorMessages.TokenCannotBeObtained:
    res.status(403).json({message: err.message, route: ''})
    break
  case ErrorMessages.UserNotFound:
    res.status(404).json({message: err.message})
    break
  case ErrorMessages.AppUrlInvalidOrExpired:
    res.status(404).json({message: err.message})
    break
  case ErrorMessages.NoVmFound:
    res.status(404).json({message: 'No VM found'})
    break
  case ErrorMessages.TokenSecretNotProvided:
    res.status(500).json({message: err.message})
    break
  case ErrorMessages.CannotCreateVmDueToServerError:
    res.status(503).json({message: err.message})
    break
  default:
    res.status(500).json({message: ErrorMessages.InternalServerError})
  }
}
