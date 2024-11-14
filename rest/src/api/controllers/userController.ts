import { Request, Response } from 'express'

import * as UserService from '../../services/userService'

export const getAllUsers = async (req: Request, res: Response) => {
  const allUserProfile  = UserService.getAllUserProfiles()
  res.json(allUserProfile)
}
