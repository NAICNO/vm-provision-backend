import express from 'express'
import { processMessage } from '../controllers/messageController'
import { authenticateApiKey } from '../middlewares/authMiddleware'

const router = express.Router()

router.use(authenticateApiKey)

router.post('/process', processMessage)

export default router
