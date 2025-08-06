import express from 'express'
import { verifyUser } from '../middlewares/auth'
import { getAI } from '../AI/gemini'

const router = express.Router()

router.route("/myBot").post(getAI)

export default router