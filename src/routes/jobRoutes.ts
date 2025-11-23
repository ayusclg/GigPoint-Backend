// routes/jobRoutes.ts
import express from "express";
import { verifyUser } from "../middlewares/auth";
import { Upload } from "../middlewares/UploadImage";
import { JobController } from "../controllers/jobController";
import { validateJobPost } from "../middlewares/validation";
import { limitJobApplications, limitJobPosts } from "../Algorithms/limiting";

const router = express.Router();
const jobController = new JobController();

router.post(
  "/user/create",
  verifyUser,
  limitJobPosts,
  Upload.array("image"),
  validateJobPost,
  jobController.createJob
);
router.get("/user/get/jobs", verifyUser, jobController.getMyJobs);
router.get("/get/:id", verifyUser, jobController.getJobById);
router.delete("/user/delete/:id", verifyUser, jobController.deleteJob);
router.post(
  "/worker/apply/:id",
  verifyUser,
  limitJobApplications,
  jobController.applyJob
);
router.post(
  "/user/approve/:id",
  verifyUser,
  jobController.approveJobApplication
);
router.get(
  "/user/apply/view/:id",
  verifyUser,
  jobController.viewAllApplication
);
router.get(
  "/get/application/:id",
  verifyUser,
  jobController.getSingleApplication
);
router.get(
  "/worker/get/application",
  verifyUser,
  jobController.viewMyApplications
);
router.post("/searchJob", verifyUser, jobController.searchJob);
router.get("/recomendJob", verifyUser, jobController.recomendJob);
router.get("/recomendWorker", verifyUser, jobController.recomendWorkerNearby);

export default router;
