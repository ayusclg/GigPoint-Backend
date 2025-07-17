import express from "express";
import { verifyUser } from "../middlewares/auth";
import { Upload } from "../middlewares/UploadImage";
import {
  applyJob,
  approveJobApplication,
  createJob,
  deleteJob,
  getJobById,
  getMyJobs,
  getSingleApplication,
  searchJob,
  viewAllApplication,
  viewMyApplications,
} from "../controllers/jobController";
import { validateJobPost } from "../middlewares/validation";

const router = express.Router();

router
  .route("/user/create")
  .post(verifyUser, Upload.array("image"), validateJobPost, createJob);
router.route("/user/get/jobs").get(verifyUser, getMyJobs);
router.route("/get/:id").get(verifyUser, getJobById);
router.route("/user/delete/:id").delete(verifyUser, deleteJob);
router.route("/worker/apply/:id").post(verifyUser, applyJob);
router.route("/user/approve/:id").post(verifyUser, approveJobApplication);
router.route("/user/apply/view/:id").get(verifyUser, viewAllApplication);
router.route("/get/application/:id").get(verifyUser, getSingleApplication);
router.route("/worker/get/application").get(verifyUser, viewMyApplications);
router.route("/searchJob").post(verifyUser, searchJob);

export default router;
