// @types/express-session/index.d.ts
import session from 'express-session'
import { UserProfile } from '@prisma/client'

declare module 'express-session' {
  interface SessionData {
    user: UserProfile;
    idToken: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
    refreshTokenExpiresAt: number;
    reauthenticatedAt: number;
  }
}
