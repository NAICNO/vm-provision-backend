import jwt, { JwtPayload } from 'jsonwebtoken'
import axios from 'axios'
import { ErrorMessages } from '../utils/ErrorMessages'
import * as UserService from './UserService'
import { UserActivityType } from '../utils/UserActivityType'

export const fetchTokens = async (code: string, nonce: string) => {

  const data = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: process.env.AUTH_REDIRECT_URL,
    nonce: nonce,
  }

  try {
    const response = await axios.post('https://oidc.fp.educloud.no/ec-oidc-provider/token', data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': getAuthHeader()
        },
      }
    )

    const {access_token, id_token, refresh_token} = response.data
    const signedAccessToken = signAccessToken(access_token)

    const decodedIdToken = decodeIdToken(id_token) as JwtPayload

    let userProfile = await UserService.findUserProfileByUsername(decodedIdToken.user)

    if (!userProfile) {
      userProfile = await UserService.createUserProfileWithIdToken(decodedIdToken)
    }

    await UserService.logUserActivity(userProfile.userId, UserActivityType.USER_LOGIN_SUCCESS, null)

    return {
      accessToken: signedAccessToken,
      idToken: id_token,
      refreshToken: refresh_token,
    }
  } catch (error) {
    console.error('Error fetching external tokens:', error)
    throw new Error(ErrorMessages.TokenCannotBeObtained)

  }
}

export const refreshTokens = async (refreshToken: string, scope: string) => {

  const data = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: scope,
  }

  try {
    const response = await axios.post('https://oidc.fp.educloud.no/ec-oidc-provider/token', data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': getAuthHeader()
        },
      }
    )
    const {access_token, id_token, refresh_token} = response.data
    const signedAccessToken = signAccessToken(access_token)

    const decodedIdToken = decodeIdToken(id_token) as JwtPayload
    const userProfile = await UserService.findUserProfileByUsername(decodedIdToken.user)
    if (!userProfile) {
      throw new Error(`User not found - ${decodedIdToken.user}`)
    }
    UserService.logUserActivity(userProfile.userId, UserActivityType.USER_TOKEN_REFRESHED, null)
    return {
      accessToken: signedAccessToken,
      idToken: id_token,
      refreshToken: refresh_token,
    }
  } catch (error) {
    console.error('Cannot refresh token', error)
    const logData = error instanceof Error ? error.message : ''
    UserService.logUserActivity('', UserActivityType.USER_TOKEN_REFRESH_FAILED, {message: logData})
    throw new Error(ErrorMessages.TokenRefreshFailed)
  }
}


export const validateAccessToken = async (authHeader: string) => {
  if (!authHeader) {
    throw new Error(ErrorMessages.TokenNotProvided)
  }

  const token = authHeader.split(' ')[1]
  if (token === null) {
    throw new Error(ErrorMessages.TokenNotProvided)
  }

  const accessTokenSecret = process.env.AUTH_ACCESS_TOKEN_SECRET
  if (!accessTokenSecret) {
    throw new Error(ErrorMessages.TokenSecretNotProvided)
  }

  try {
    const verifiedJwt = jwt.verify(token, accessTokenSecret)

    if (typeof verifiedJwt !== 'object' || !verifiedJwt.id || !verifiedJwt.exp) {
      throw new Error(ErrorMessages.TokenInvalid)
    }

    const isExpired = validateAccessTokenExpiration(verifiedJwt.exp)
    if (isExpired) {
      throw new Error(ErrorMessages.TokenExpired)
    }
    const userId = verifiedJwt.id
    console.log('userId', userId)
    const userProfile = await UserService.findUserProfileByUsername(userId)
    if (!userProfile) {
      UserService.logUserActivity(userId, 'USER_LOGIN_FAILED', {message: 'User not found'})
      throw new Error(ErrorMessages.UserNotFound)
    }
    return userProfile
  } catch (err) {
    console.log('err', err)
    if (err instanceof Error && err.message === 'TokenExpiredError: jwt expired') {
      throw new Error(ErrorMessages.TokenExpired)
    }
    if (err instanceof Error && (err.message === ErrorMessages.TokenExpired || err.message === ErrorMessages.UserNotFound)) {
      throw err
    }
    throw new Error(ErrorMessages.TokenInvalid)
  }
}

export const validateApiKey = async (apiKey: string) => {
  if (!apiKey) {
    throw new Error(ErrorMessages.ApiKeyNotProvided)
  }

  const apiKeySecret = process.env.AUTH_API_KEY_SECRET
  if (!apiKeySecret) {
    throw new Error(ErrorMessages.InternalServerError)
  }

  if (apiKey !== apiKeySecret) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }
}

const getAuthHeader = () => {
  const auth = Buffer.from(`${process.env.AUTH_CLIENT_ID}:${process.env.AUTH_CLIENT_SECRET}`).toString('base64')
  return `Basic ${auth}`
}

export const decodeIdToken = (idToken: string) => {
  return jwt.decode(idToken)
}
export const signAccessToken = (accessToken: string) => {
  const accessTokenSecret = process.env.AUTH_ACCESS_TOKEN_SECRET
  if (!accessTokenSecret) {
    throw new Error(ErrorMessages.TokenSecretNotProvided)
  }

  const decodedAccessToken = jwt.decode(accessToken) as string
  return jwt.sign(decodedAccessToken, accessTokenSecret)
}


const validateAccessTokenExpiration = (timestamp: number): boolean => {
  const now = Math.floor(Date.now() / 1000)
  return now > timestamp
}
