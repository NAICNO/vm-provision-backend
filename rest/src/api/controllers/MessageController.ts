import { Request, Response } from 'express'
import * as VmService from '../../services/VmService'

export const processMessage = async (req: Request, res: Response) => {
  const vmId = req.body.vmId
  const action = req.body.action
  const queueName = req.body.queueName
  const message = req.body.message

  const result = await VmService.updateVmProvisioningStatus(vmId, action, queueName, message)
  res.json(result)
}
