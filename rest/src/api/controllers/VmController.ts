import { Request, Response } from 'express'
import * as VmService from '../../services/VmService'
import * as SshKeyService from '../../services/SshKeyService'

export const getAllUserVms = async (req: Request, res: Response) => {
  const userProfile = req.userProfile
  const machines = await VmService.getAllUserVms(userProfile?.userId)
  res.json(machines)
}

export const getVm = async (req: Request, res: Response) => {
  const userProfile = req.userProfile
  const vmId = req.params.vmId
  const vmData = await VmService.getVmOfUserById(vmId, userProfile?.userId)
  res.json(vmData)
}

export const getVmTemplates = async (req: Request, res: Response) => {
  const vmTemplates = await VmService.getAllVmTemplates()
  res.json(vmTemplates)
}

export const startVmProvisioning = async (req: Request, res: Response) => {
  const userProfile = req.userProfile
  const vmName = req.body.vmName
  const vmTemplateId = req.body.vmTemplateId
  const sshKeyId = req.body.sshKeyId
  const duration = req.body.duration
  const ipRanges = req.body.ipRanges
  const vmData = await VmService.startVmProvisioning(
    userProfile?.userId,
    vmName,
    vmTemplateId,
    sshKeyId,
    duration,
    ipRanges,
  )
  res.json(vmData)
}

export const getPublicKeys = async (req: Request, res: Response) => {
  const sshKeys = await SshKeyService.getAllUserSshKeys(req.userProfile?.userId)
  res.json(sshKeys)
}

export const createSSHKeyPair = async (req: Request, res: Response) => {
  const keyName = req.body.keyName
  const keyData = await SshKeyService.createSSHKeyPair(req.userProfile?.userId, keyName)
  res.json(keyData)
}

export const requestVmDestroy = async (req: Request, res: Response) => {
  const vmId = req.params.vmId
  const userProfile = req.userProfile
  await VmService.requestVmDestroy(vmId, userProfile?.userId)
  res.json({ status: 'success' })
}
