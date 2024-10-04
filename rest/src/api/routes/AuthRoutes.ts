import express from 'express'
import { logout, authenticate, getAuthStatus, deleteUserProfile } from '../controllers/AuthController'
import { requireReauthentication } from '../middlewares/AuthMiddleware'

const router = express.Router()

router.post('/authenticate', authenticate)
router.get('/status', getAuthStatus)
router.post('/logout', logout)
router.delete('/delete', requireReauthentication, deleteUserProfile)

export default router
