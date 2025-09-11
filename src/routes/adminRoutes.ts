import express from "express";
import { admin } from "../controllers/adminController";
import { verifyUser } from "../middlewares/auth";

const router = express.Router()

router.route("/viewAll").get(verifyUser,admin.viewAllUser)
router.route("/removeUser").delete(verifyUser, admin.removeUser)
router.route("/jobs").get(verifyUser, admin.jobList)
router.route("/dash").get(verifyUser,admin.dashboardData)

export default router