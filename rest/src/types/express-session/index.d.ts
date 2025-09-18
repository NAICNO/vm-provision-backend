// @types/express-session/index.d.ts
import session from 'express-session'
import { UserProfile } from '@prisma/client'
import type { TokenEndpointResponse } from 'openid-client'

// Minimal session token type we store
export type SessionToken = TokenEndpointResponse & {
  expired?: () => boolean
  claims?: () => any
  _fetchedAt?: number
}

declare module 'express-session' {
  interface SessionData {
    user: UserProfile;
    tokenSet: SessionToken;
  }
}
