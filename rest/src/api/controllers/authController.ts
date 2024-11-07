import { NextFunction, Request, Response } from 'express'
import * as AuthService from '../../services/authService'
import * as UserService from '../../services/userService'
import { UserActivityType, UserProfileStatus } from '@prisma/client'
import { ErrorMessages } from '../../utils/errorMessages'
import logger from '../../utils/logger'

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {code, nonce, isReauth} = req.body

    const {idToken, accessToken, refreshToken, oidcUser} = await AuthService.fetchTokens(code, nonce)

    const accessTokenExpiresAt = AuthService.getExpirationOfToken(accessToken)
    const refreshTokenExpiresAt = AuthService.getExpirationOfToken(refreshToken)

    logger.debug('User authenticated')

    let userProfile = await UserService.findUserProfileByEmail(oidcUser.email)

    if (!userProfile) {
      userProfile = await UserService.createUserProfileWithOidcUser(oidcUser)
    }

    req.session.idToken = idToken
    req.session.accessToken = accessToken
    req.session.refreshToken = refreshToken
    req.session.accessTokenExpiresAt = accessTokenExpiresAt * 1000
    req.session.refreshTokenExpiresAt = refreshTokenExpiresAt * 1000

    if (userProfile.status === UserProfileStatus.DISABLED) {
      throw new Error(ErrorMessages.UserDisabled)

    } else if (userProfile.status === UserProfileStatus.PENDING_DELETION) {
      throw new Error(ErrorMessages.UserPendingDeletion)
    }

    const sanitizedUserProfile = UserService.sanitizeUserProfile(userProfile)

    req.session.user = userProfile

    if (isReauth) {
      // Set re-authentication timestamp
      req.session.reauthenticatedAt = Date.now()
    }

    res.json({success: true, user: sanitizedUserProfile})

    UserService.logUserActivity(userProfile.userId, UserActivityType.USER_LOGIN_SUCCESS)
  } catch (error) {
    UserService.logUserActivity('user-unknown', UserActivityType.USER_LOGIN_FAILED, '', {error: error})
    next(error)
  }
}


export const getAuthStatus = async (req: Request, res: Response) => {
  if (req.session && req.session.idToken && req.session.user) {
    try {
      await AuthService.validateIdToken(req.session.idToken)
      res.json({
        isAuthenticated: true,
        user: req.session.user,
      })
    } catch (error) {
      logger.error('Error validating id token', error)
      res.json({
        isAuthenticated: false,
        user: null,
      })
    }
  } else {
    res.json({
      authenticated: false,
      user: null,
    })
  }
}


export const logout = async (req: Request, res: Response, next: NextFunction) => {
  const idTokenHint = req.session.idToken || null
  const userId = req.session?.user?.userId || 'user-unknown'
  req.session.destroy(() => {
    const logoutUrl = AuthService.getLogoutUrl(idTokenHint)
    res.json({logoutUrl})
    UserService.logUserActivity(userId, UserActivityType.USER_LOGGED_OUT)
  })
}

export const deleteUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userProfile = req.session.user
    await UserService.markUserProfileForDeletion(userProfile!.userId)
    res.status(200).json({success: true})
  } catch (error) {
    next(error)
  }
}
