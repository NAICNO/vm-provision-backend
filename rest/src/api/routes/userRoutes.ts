import express from 'express'
import { ensureAuthenticated, requireAdmin } from '../middlewares/authMiddleware'
import { getAllUsers } from '../controllers/userController'

const router = express.Router()

router.use(ensureAuthenticated)
router.get('/all', requireAdmin, getAllUsers)

export default router
