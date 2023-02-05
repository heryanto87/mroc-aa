import express from 'express'
import { simpleAccountCreate } from '../controllers/simpleAccount'

const router = express.Router()

router.post('/create', simpleAccountCreate)

export default router
