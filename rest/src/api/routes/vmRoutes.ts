import express from 'express'

import {
  archiveVm,
  createSSHKeyPair,
  getAllProviders,
  getAllVmTemplatesByProvider,
  getAllVmsOfUser,
  getProviderById,
  getPublicKeys,
  getVm, getVmTemplateById,
  getVmTemplates,
  requestVmDestroy,
  startVmProvisioning,
} from '../controllers/vmController'
import { ensureAuthenticated, requireAdmin } from '../middlewares/authMiddleware'

const router = express.Router()

router.use(ensureAuthenticated)
router.get('/', getAllVmsOfUser)
router.get('/templates', getVmTemplates)
router.get('/ssh/keys', getPublicKeys)
router.post('/ssh/create', createSSHKeyPair)
router.post('/create', startVmProvisioning)
router.delete('/destroy/:vmId', requestVmDestroy)
router.put('/archive/:vmId', archiveVm)

router.get('/providers', requireAdmin, getAllProviders)
router.get('/providers/:providerId', requireAdmin, getProviderById)
router.get('/providers/:providerId/templates', requireAdmin, getAllVmTemplatesByProvider)
router.get('/templates/:templateId', requireAdmin, getVmTemplateById)

router.get('/:vmId', getVm)

export default router

