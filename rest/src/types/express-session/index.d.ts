// @types/express-session/index.d.ts
import session from 'express-session'
import { UserProfile } from '@prisma/client'

declare module 'express-session' {
  interface SessionData {
    user: Partial<UserProfile>;
    idToken: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
  }
}
