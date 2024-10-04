import express from 'express'
import { logout, authenticate, getAuthStatus, deleteUserProfile } from '../controllers/authController'
import { requireReauthentication } from '../middlewares/authMiddleware'

const router = express.Router()

router.post('/authenticate', authenticate)
router.get('/status', getAuthStatus)
router.post('/logout', logout)
router.delete('/delete', requireReauthentication, deleteUserProfile)

export default router
