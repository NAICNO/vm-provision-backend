import { Request } from 'express'
import { UserProfile } from '@prisma/client'

declare module 'express-serve-static-core' {
  export interface Request {
    userProfile?: UserProfile; // Add your custom property here
  }
}
