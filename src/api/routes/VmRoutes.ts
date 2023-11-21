import express from 'express'
import { getAllUserVms, getVmTemplates } from '../controllers/VmController'
import { authenticateToken } from '../middlewares/AuthMiddleware'

const router = express.Router()

router.use(authenticateToken)
router.get('/', getAllUserVms)
router.get('/templates', getVmTemplates)

export default router
