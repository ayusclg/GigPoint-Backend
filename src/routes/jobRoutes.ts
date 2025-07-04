import express from 'express'
import { verifyUser } from '../middlewares/auth'
import { Upload } from '../middlewares/UploadImage'
import { applyJob, approveJobApplication, createJob, deleteJob, getJobById, getMyJobs, getSingleJob, viewAllApplication } from '../controllers/jobController'

const router = express.Router()

router.route("/create").post(verifyUser, Upload.array("image"), createJob)
router.route("/get/jobs").get(verifyUser,getMyJobs)
router.route("/get/:id").get(verifyUser, getJobById)
router.route("/delete/:id").delete(verifyUser, deleteJob)
router.route("/apply/:id").post(verifyUser, applyJob)
router.route("/approve/:id").post(verifyUser, approveJobApplication)
router.route("/apply/view/:id").get(verifyUser, viewAllApplication)
router.route("/get/my/:id").get(verifyUser,getSingleJob)

export default router