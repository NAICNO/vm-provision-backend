import { Request, Response } from 'express'
import * as VmService from '../../services/VmService'

export const getAllUserVms = async (req: Request, res: Response) => {
  const userProfile = req.userProfile
  console.log('userProfile', userProfile)
  const machines = await VmService.getAllUserVms(userProfile?.userId)
  res.json(machines)
}

export const getVmTemplates = async (req: Request, res: Response) => {

  const machines = VmService.getAllVmTemplates()
  res.json(machines)
}
