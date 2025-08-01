import express from "express";
import { Upload } from "../middlewares/UploadImage";
import {
  getUserById,
  myProfile,
  workerLogin,
  userLogout,
  workerRegister,
  updateWorkerDetails,
  searchWorker,
  forgotPassword,
  verifyOtp,
  resetPassword,
  makeAvailable,
  addUserAddress,
} from "../controllers/userController";
import { verifyUser } from "../middlewares/auth";
import {
  passwordResetValidation,
  validateRegisterWorker,
} from "../middlewares/validation";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management routes
 */

router
  .route("/create")
  .post(
    Upload.single("profilePicture"),
    validateRegisterWorker,
    workerRegister
  );
router.route("/login").post(workerLogin);
router.route("/logout").post(verifyUser, userLogout);
router.route("/getById/:id").get(verifyUser, getUserById);
router.route("/my").get(verifyUser, myProfile);
router
  .route("/update")
  .put(verifyUser, Upload.single("profilePicture"), updateWorkerDetails);
router.route("/search").post(verifyUser, searchWorker);

router.route("/forgotPassword").post(forgotPassword);
router.route("/verifyOtp").post(verifyOtp),
  router.route("/resetPassword").post(passwordResetValidation, resetPassword);

router.route("/available").post(verifyUser, makeAvailable)
router.route("/uAddress").post(verifyUser,addUserAddress)  

export default router;
