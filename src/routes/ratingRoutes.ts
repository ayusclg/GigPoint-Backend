import express from 'express'
import { verifyUser } from '../middlewares/auth'
import { createRating, deleteRating, myRating } from '../controllers/ratingController'

const router = express.Router()

router.route("/").post(verifyUser, createRating)
router.route("/my").get(verifyUser, myRating)
router.route("/delete").delete(verifyUser,deleteRating)

export default router