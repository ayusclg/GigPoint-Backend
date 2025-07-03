import express from 'express'
import { verifyUser } from '../middlewares/auth'
import { Upload } from '../middlewares/UploadImage'
import { createJob } from '../controllers/jobController'

const router = express.Router()

router.route("/create").post(verifyUser,Upload.array("image"),createJob)

export default router