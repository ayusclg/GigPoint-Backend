import express from 'express'
import { verifyUser } from '../middlewares/auth'
import { createRating } from '../controllers/ratingController'

const router = express.Router()

router.route("/rate").post(verifyUser,createRating)

export default router