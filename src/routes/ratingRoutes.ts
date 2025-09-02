import express from "express";
import { verifyUser } from "../middlewares/auth";
import { ratingController } from "../controllers/ratingController";

const router = express.Router();

router.route("/").post(verifyUser, ratingController.createRating);
router.route("/my").get(verifyUser, ratingController.myRating);
router.route("/delete").delete(verifyUser, ratingController.deleteRating);
router.route("/recent").get(verifyUser, ratingController.showRecentRating);
router.route("/all").get(verifyUser, ratingController.viewAllRating);

export default router;
