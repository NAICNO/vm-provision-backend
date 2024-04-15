import express from 'express'

import { handleAppUrl } from '../controllers/AppUrlController'
import { validateAppUrl } from '../middlewares/AppUrlValidator'

const router = express.Router()

router.post('/:token', validateAppUrl, handleAppUrl)

export default router
