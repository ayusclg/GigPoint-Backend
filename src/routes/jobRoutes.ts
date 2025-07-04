import express from 'express'
import { verifyUser } from '../middlewares/auth'
import { Upload } from '../middlewares/UploadImage'
import { createJob, deleteJob, getJobById } from '../controllers/jobController'
import { verify } from 'crypto'

const router = express.Router()

router.route("/create").post(verifyUser, Upload.array("image"), createJob)
router.route("/get/:id").get(verifyUser, getJobById)
router.route("/delete/:id").delete(verifyUser,deleteJob)

export default router