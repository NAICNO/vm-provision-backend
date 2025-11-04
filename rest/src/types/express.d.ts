import { AppUrl, UserProfile } from '@prisma/client'

declare module 'express-serve-static-core' {
  export interface Request {
    // Add your custom property here
    userProfile?: UserProfile
    appUrl?: AppUrl
    id?: string
  }
}
