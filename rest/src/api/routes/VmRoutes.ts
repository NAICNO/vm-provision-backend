import express from 'express'
import {
  createSSHKeyPair,
  getAllUserVms,
  getPublicKeys,
  getVm,
  getVmTemplates, requestVmDestroy,
  startVmProvisioning,
} from '../controllers/VmController'
import { authenticateToken } from '../middlewares/AuthMiddleware'

const router = express.Router()

router.use(authenticateToken)
router.get('/', getAllUserVms)
router.get('/templates', getVmTemplates)
router.get('/ssh/keys', getPublicKeys)
router.post('/ssh/create', createSSHKeyPair)
router.post('/create', startVmProvisioning)
router.delete('/destroy/:vmId', requestVmDestroy)
router.get('/:vmId', getVm)

export default router

