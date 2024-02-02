import express from 'express'
import {
  createSSHKeyPair,
  getAllUserVms,
  getPublicKeys,
  getVm,
  getVmTemplates,
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
router.get('/:vmId', getVm)

export default router

