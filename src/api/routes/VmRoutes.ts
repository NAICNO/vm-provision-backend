import express from 'express'
import {
  createSSHKeyPair, createVm,
  getAllUserVms,
  getPublicKeys,
  getVmTemplates
} from '../controllers/VmController'
import { authenticateToken } from '../middlewares/AuthMiddleware'

const router = express.Router()

router.use(authenticateToken)
router.get('/', getAllUserVms)
router.get('/templates', getVmTemplates)
router.get('/ssh/keys', getPublicKeys)
router.post('/ssh/create', createSSHKeyPair)
router.post('/create', createVm)

export default router
