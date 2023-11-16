import { Request } from 'express'

declare module 'express-serve-static-core' {
  export interface Request {
    username?: string; // Add your custom property here
  }
}
