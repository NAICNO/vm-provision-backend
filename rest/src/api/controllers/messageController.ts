import { Request, Response } from 'express'
import * as VmService from '../../services/vmService'

export const processMessage = async (req: Request, res: Response) => {
  const vmId = req.body.vmId
  const action = req.body.action
  const queueName = req.body.queueName
  const message = req.body.message

  const result = await VmService.updateVmProvisioningStatusByTfLog(vmId, action, queueName, message)
  res.json(result)
}
