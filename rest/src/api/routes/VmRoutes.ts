import express from 'express'
import {
  archiveVm,
  createSSHKeyPair,
  getAllUserVms,
  getPublicKeys,
  getVm,
  getVmTemplates,
  requestVmDestroy,
  startVmProvisioning,
} from '../controllers/VmController'
import { ensureAuthenticated } from '../middlewares/AuthMiddleware'

const router = express.Router()

router.use(ensureAuthenticated)
router.get('/', getAllUserVms)
router.get('/templates', getVmTemplates)
router.get('/ssh/keys', getPublicKeys)
router.post('/ssh/create', createSSHKeyPair)
router.post('/create', startVmProvisioning)
router.delete('/destroy/:vmId', requestVmDestroy)
router.put('/archive/:vmId', archiveVm)
router.get('/:vmId', getVm)

export default router

