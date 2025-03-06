import { TokenSet } from 'openid-client'
import { Request } from 'express'

import { ErrorMessages } from '../utils/errorMessages'
import { client } from '../utils/authUtils'

export const getLoginUrl = async () => {
  return client?.authorizationUrl({
    scope: 'openid profile email organization',
  })
}

export const fetchTokens = async (req: Request): Promise<TokenSet | undefined> => {
  const params = client?.callbackParams(req)
  return client?.callback(process.env.SIGMA_REDIRECT_URI!, params!)
}

export const getUserInfo = async (accessToken: string) => {
  return client?.userinfo(accessToken)
}

export const checkTokenExpiry = (tokenSet?: TokenSet): boolean => {
  return !!tokenSet?.expired()
}

export const refreshTokens = async (tokenSet: TokenSet): Promise<TokenSet> => {
  return await client!.refresh(tokenSet.refresh_token!)
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

export const getLogoutUrl = (idToken: string) => {
  // Construct the logout URL.
  // Note: If no idToken is available, you can omit id_token_hint.
  return client?.endSessionUrl({
    id_token_hint: idToken,
    post_logout_redirect_uri: process.env.SIGMA_LOGOUT_REDIRECT_URI // The URI to redirect back to after logout
  })
}
