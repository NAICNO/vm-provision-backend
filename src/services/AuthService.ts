import jwt from 'jsonwebtoken'
import axios from 'axios'
import { ErrorMessages } from '../utils/ErrorMessages'

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
    return {
      accessToken: signedAccessToken,
      idToken: id_token,
      refreshToken: refresh_token,
    }
  } catch (error) {
    console.error('Error fetching external data:', error)
    throw error
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
    return {
      accessToken: signedAccessToken,
      idToken: id_token,
      refreshToken: refresh_token,
    }
  } catch (error) {
    console.error('Cannot refresh token', error)
    throw new Error(ErrorMessages.TokenRefreshFailed)
  }
}

function getAuthHeader() {
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

export const validateAccessToken = (authHeader: string): string => {
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
    return userId
  } catch (err) {
    console.log('err', err)
    if (err instanceof Error && err.message === ErrorMessages.TokenExpired) {
      throw err
    }
    throw new Error(ErrorMessages.TokenInvalid)
  }

}

const validateAccessTokenExpiration = (timestamp: number): boolean => {
  const now = Math.floor(Date.now() / 1000)
  return now > timestamp
}
