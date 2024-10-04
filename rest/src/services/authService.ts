import jwt, { JwtPayload } from 'jsonwebtoken'
import axios from 'axios'

import { ErrorMessages } from '../utils/errorMessages'
import * as queryString from 'node:querystring'
import jwksClient from 'jwks-rsa'

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

    const user = await validateIdToken(id_token)

    return {
      accessToken: access_token,
      idToken: id_token,
      refreshToken: refresh_token,
      oidcUser: user
    }
  } catch (error) {
    console.log('Error fetching external tokens')
    throw new Error(ErrorMessages.TokenCannotBeObtained)
  }
}

export const getExpirationOfToken = (token: string): number => {
  const decoded = jwt.decode(token) as JwtPayload
  if(!decoded.exp) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }
  return decoded.exp
}

export const refreshTokens = async (refreshToken: string) => {
  const data = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: 'openid profile email',
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

    const user = await validateIdToken(id_token)

    return {
      accessToken: access_token,
      idToken: id_token,
      refreshToken: refresh_token,
      oidcUser: user
    }
  } catch (error) {
    throw new Error(ErrorMessages.TokenRefreshFailed)
  }
}


export function validateIdToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: 'https://oidc.fp.educloud.no/ec-oidc-provider/',
        audience: process.env.AUTH_CLIENT_ID,
      },
      (err, decoded) => {
        if (err) {
          reject(err)
        } else {
          resolve(decoded)
        }
      }
    )
  })
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


const client = jwksClient({
  jwksUri: 'https://oidc.fp.educloud.no/ec-oidc-provider/jwk',
})

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      callback(err, null)
    } else {
      const signingKey = key?.getPublicKey()
      callback(null, signingKey)
    }
  })
}

export const getLogoutUrl = (idTokenHint: string | null) => {
  return `${process.env.AUTH_END_SESSION_URL}?${queryString.stringify(
    {
      id_token_hint: idTokenHint,
      post_logout_redirect_uri: process.env.AUTH_LOGOUT_REDIRECT_URL,
    }
  )}`
}
