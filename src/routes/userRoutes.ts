import express from "express";
import { Upload } from "../middlewares/UploadImage";
import { verifyUser } from "../middlewares/auth";
import {
  passwordResetValidation,
  validateRegisterWorker,
} from "../middlewares/validation";
import { userController } from "../controllers/userController";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management routes
 */
router.post(
  "/create",
  Upload.single("profilePicture"),
  validateRegisterWorker,
  userController.workerRegister
);
router.post("/login", userController.workerLogin);
router.post("/logout", verifyUser, userController.userLogout);
router.get("/getById/:id", verifyUser, userController.getUserById);
router.get("/my", verifyUser, userController.myProfile);
router.put(
  "/update",
  verifyUser,
  Upload.single("profilePicture"),
  userController.updateWorkerDetails
);
router.post("/search", verifyUser, userController.searchWorker);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/verifyOtp", userController.verifyOtp);
router.post(
  "/resetPassword",
  passwordResetValidation,
  userController.resetPassword
);
router.post("/available", verifyUser, userController.makeAvailable);
router.post("/uAddress", verifyUser, userController.addUserAddress);
router.get("/workerReports", verifyUser, userController.workerReports);
router.get("/recentWorkers", verifyUser, userController.myRecentWorkers);
router.get("/myCompleted", verifyUser, userController.myCompletedJobs);
router.post("/accessToken",verifyUser,userController.regenerateAccessToken)

export default router;
