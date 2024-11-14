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

    // Validate user project membership
    const isMember = UserService.validateUserProjectMembership(oidcUser.projects)

    if (!isMember) {
      throw new Error(ErrorMessages.UserIsNotMemberOfProject)
    }

    let userProfile = await UserService.findUserProfileByEmail(oidcUser.email)

    if (userProfile?.status === UserProfileStatus.DISABLED) {
      throw new Error(ErrorMessages.UserDisabled)
    } else if (userProfile?.status === UserProfileStatus.PENDING_DELETION) {
      throw new Error(ErrorMessages.UserPendingDeletion)
    }

    // Check if the user is a project admin
    const isAdmin = UserService.validateUserProjectAdmin(oidcUser.groups)

    // Update local user type with OIDC user data if necessary
    if (userProfile) {
      userProfile = await UserService.updateUserProfileWithOidcUser(userProfile, oidcUser, isAdmin)
    }

    if (!userProfile) {
      userProfile = await UserService.createUserProfileWithOidcUser(oidcUser, isAdmin)
    }

    const sanitizedUserProfile = UserService.sanitizeUserProfile(userProfile)

    req.session.idToken = idToken
    req.session.accessToken = accessToken
    req.session.refreshToken = refreshToken
    req.session.accessTokenExpiresAt = accessTokenExpiresAt * 1000
    req.session.refreshTokenExpiresAt = refreshTokenExpiresAt * 1000
    req.session.user = userProfile

    if (isReauth) {
      // Set re-authentication timestamp
      req.session.reauthenticatedAt = Date.now()
    }

    res.json({success: true, user: sanitizedUserProfile})

    UserService.logUserActivity(userProfile.userId, UserActivityType.USER_LOGIN_SUCCESS)
    logger.info(`User ${userProfile.userId} logged in`)
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
