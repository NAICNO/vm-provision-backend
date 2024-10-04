import express from 'express'

import { handleAppUrl } from '../controllers/appUrlController'
import { validateAppUrl } from '../middlewares/appUrlValidator'

const router = express.Router()

router.post('/:token', validateAppUrl, handleAppUrl)

export default router
