import { NextFunction, Request, Response } from 'express'
import { TokenSet } from 'openid-client'
import { UserActivityType, UserProfileStatus } from '@prisma/client'

import * as AuthService from '../../services/authService'
import * as UserService from '../../services/userService'
import { ErrorMessages } from '../../utils/errorMessages'
import logger from '../../utils/logger'

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loginUrl = await AuthService.getLoginUrl()
    if (loginUrl !== undefined) {
      res.redirect(loginUrl)
    } else {
      throw new Error(ErrorMessages.InternalServerError)
    }
  } catch (error) {
    next(error)
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tokenSet = await AuthService.fetchTokens(req)
    // @ts-ignore
    const oidcUser = await AuthService.getUserInfo(tokenSet.access_token!)

    let userProfile = await UserService.findUserProfileByEmail(oidcUser!.email!)


    if (userProfile?.status === UserProfileStatus.DISABLED) {
      throw new Error(ErrorMessages.UserDisabled)
    } else if (userProfile?.status === UserProfileStatus.PENDING_DELETION) {
      throw new Error(ErrorMessages.UserPendingDeletion)
    }

    // Update local user type with OIDC user data if necessary
    if (userProfile) {
      userProfile = await UserService.updateUserProfileWithOidcUser(userProfile, oidcUser)
    }

    if (!userProfile) {
      userProfile = await UserService.createUserProfileWithOidcUser(oidcUser, false)
    }

    req.session.tokenSet = tokenSet
    req.session.user = userProfile
    res.redirect(process.env.AUTH_POST_LOGIN_REDIRECT_URL!)


    await UserService.logUserActivity(userProfile.userId, UserActivityType.USER_LOGIN_SUCCESS)
    logger.info(`User ${userProfile.userId} logged in`)
  } catch (error) {
    console.log('Auth function Error:', error)
    await UserService.logUserActivity('user-unknown', UserActivityType.USER_LOGIN_FAILED, '', {error: error})
    next(error)
  }
}

export const getAuthStatus = async (req: Request, res: Response) => {
  if (req.session && req.session.tokenSet) {
    // Rehydrate the TokenSet instance from the stored plain object
    const tokenSet = new TokenSet(req.session.tokenSet)

    const isTokensExpired = AuthService.checkTokenExpiry(tokenSet)
    if (!isTokensExpired) { // Tokens are still valid
      res.json({
        isAuthenticated: true,
        user: req.session.user,
      })
    } else { // Tokens are expired - try to refresh
      try {
        // const user = await AuthService.getUserInfo(newTokenSet.access_token!)
        req.session.tokenSet = await AuthService.refreshTokens(req.session.tokenSet)
        // req.session.user = user
        res.json({
          isAuthenticated: true,
          user: req.session.user,
        })
      } catch (error) { // Refresh failed
        logger.error('Error refreshing tokens', error)
        res.json({
          isAuthenticated: false,
          user: null,
        })
      }
    }
  } else { // No tokens in session
    res.json({
      isAuthenticated: false,
      user: null,
    })
  }
}


export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Retrieve the ID token from the stored tokenSet (if available)
    const idToken = req.session.tokenSet && req.session.tokenSet.id_token
    const userId = req.session?.user?.userId || 'user-unknown'
    // Clear your local session
    req.session.destroy((err) => {
      if (err) {
        return next(err)
      }

      // Construct the logout URL.
      // Note: If no idToken is available, you can omit id_token_hint.
      const logoutUrl = AuthService.getLogoutUrl(idToken!)

      // Redirect the user to Keycloak's logout endpoint
      res.json({logoutUrl})
      UserService.logUserActivity(userId || 'user-unknown', UserActivityType.USER_LOGGED_OUT)
    })
  } catch (error) {
    next(error)
  }
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
