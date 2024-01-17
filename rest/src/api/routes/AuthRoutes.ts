import express from 'express'
import { getTokens, refreshTokens } from '../controllers/AuthController'

const router = express.Router()

router.get('/token', getTokens)
router.get('/token/refresh', refreshTokens)

export default router
