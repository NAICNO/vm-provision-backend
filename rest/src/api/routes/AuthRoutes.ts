import express from 'express'
import { logout, authenticate, getAuthStatus } from '../controllers/AuthController'

const router = express.Router()

router.post('/authenticate', authenticate)
router.get('/status', getAuthStatus)
router.post('/logout', logout)

export default router
