import express from 'express'
import { randomKey } from '../controllers/util'

const router = express.Router()

router.get('/', randomKey)

export default router
