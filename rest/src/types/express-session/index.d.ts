// @types/express-session/index.d.ts
import session from 'express-session'
import { UserProfile } from '@prisma/client'
import { TokenSet } from 'openid-client'

declare module 'express-session' {
  interface SessionData {
    user: UserProfile;
    tokenSet: TokenSet;
  }
}
