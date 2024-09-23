import { NextFunction, Request, Response } from 'express'
import * as AuthService from '../../services/AuthService'
import * as UserService from '../../services/UserService'
import { UserActivityType } from '@prisma/client'

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {code, nonce} = req.body

    const {idToken, accessToken, refreshToken, oidcUser} = await AuthService.fetchTokens(code, nonce)

    const accessTokenExpiresAt = AuthService.getExpirationOfToken(accessToken)
    const refreshTokenExpiresAt = AuthService.getExpirationOfToken(refreshToken)

    console.log('User authenticated')

    let userProfile = await UserService.findUserProfileByEmail(oidcUser.email)

    if (!userProfile) {
      userProfile = await UserService.createUserProfileWithOidcUser(oidcUser)
    }

    const sanitizedUserProfile = UserService.sanitizeUserProfile(userProfile)

    req.session.idToken = idToken
    req.session.accessToken = accessToken
    req.session.refreshToken = refreshToken
    req.session.accessTokenExpiresAt = new Date(accessTokenExpiresAt * 1000)
    req.session.refreshTokenExpiresAt = new Date(refreshTokenExpiresAt * 1000)
    req.session.user = sanitizedUserProfile

    res.json({success: true, user: sanitizedUserProfile})

    await UserService.logUserActivity(userProfile.userId, UserActivityType.USER_LOGIN_SUCCESS, null)
  } catch (error) {
    next(error)
  }
}


export const getAuthStatus = async (req: Request, res: Response) => {
  if (req.session && req.session.idToken) {
    res.json({
      isAuthenticated: true,
      user: req.session.user,
    })
  } else {
    res.json({
      authenticated: false,
      user: null,
    })
  }
}


export const logout = async (req: Request, res: Response, next: NextFunction) => {
  const idTokenHint = req.session.idToken || null
  req.session.destroy(() => {
    const logoutUrl = AuthService.getLogoutUrl(idTokenHint)
    res.json({logoutUrl})
  })
}
