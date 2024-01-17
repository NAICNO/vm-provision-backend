import express from 'express'
import { processMessage } from '../controllers/MessageController'
import { authenticateApiKey } from '../middlewares/AuthMiddleware'

const router = express.Router()

router.use(authenticateApiKey)

router.post('/process', processMessage)

export default router
