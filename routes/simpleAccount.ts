import express from 'express'
import { simpleAccountCreate, simpleAccountTransfer } from '../controllers/simpleAccount'

const router = express.Router()

router.post('/create', simpleAccountCreate)
router.post('/transfer', simpleAccountTransfer)

export default router
