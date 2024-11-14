import { Request, Response } from 'express'

import * as VmService from '../../services/vmService'
import * as SshKeyService from '../../services/sshKeyService'

export const getAllVmsOfUser = async (req: Request, res: Response) => {
  const userProfile = req.session.user!
  const machines = await VmService.getAllVmsOfUserWithTemplates(userProfile.userId)
  res.json(machines)
}

export const getVm = async (req: Request, res: Response) => {
  const userProfile = req.session.user!
  const vmId = req.params.vmId
  const vmData = await VmService.getVmOfUserById(vmId, userProfile?.userId)
  res.json(vmData)
}

export const getVmTemplates = async (req: Request, res: Response) => {
  const vmTemplates = await VmService.getAllVmTemplates()
  const userProfile = req.session.user
  const quota = await VmService.getUserVmQuota(userProfile?.userId)
  res.json({vmTemplates, quota})
}

export const startVmProvisioning = async (req: Request, res: Response) => {
  const userProfile = req.session.user
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
  const sshKeys = await SshKeyService.getAllUserSshKeys(req.session.user!.userId)
  res.json(sshKeys)
}

export const createSSHKeyPair = async (req: Request, res: Response) => {
  const keyName = req.body.keyName
  const keyData = await SshKeyService.createSSHKeyPair(req.session.user!.userId, keyName)
  res.json(keyData)
}

export const requestVmDestroy = async (req: Request, res: Response) => {
  const vmId = req.params.vmId
  const userProfile = req.session.user
  await VmService.requestVmDestroy(vmId, userProfile?.userId)
  res.json({status: 'success'})
}

export const archiveVm = async (req: Request, res: Response) => {
  const vmId = req.params.vmId
  const userProfile = req.session.user
  await VmService.archiveVm(vmId, userProfile?.userId)
  res.json({status: 'success'})
}

export const getAllProviders = async (req: Request, res: Response) => {
  const providers = await VmService.getAllProviders()
  res.json(providers)
}

export const getProviderById = async (req: Request, res: Response) => {
  const providerId = req.params.providerId
  const provider = await VmService.getProviderById(providerId)
  res.json(provider)
}

export const getAllVmTemplatesByProvider = async (req: Request, res: Response) => {
  const providerId = req.params.providerId
  const vmTemplates = await VmService.getAllVmTemplatesByProvider(providerId)
  res.json(vmTemplates)
}

export const getVmTemplateById = async (req: Request, res: Response) => {
  const templateId = req.params.templateId
  const template = await VmService.getVmTemplateById(templateId)
  res.json(template)
}
