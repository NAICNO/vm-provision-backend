import express from 'express'
import { login, logout, authenticate, getAuthStatus } from '../controllers/authController'


const router = express.Router()

router.get('/login', login)
router.get('/callback', authenticate)
router.get('/status', getAuthStatus)
router.post('/logout', logout)

export default router
