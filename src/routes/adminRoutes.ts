import express from "express";
import { admin } from "../controllers/adminController";
import { verifyUser } from "../middlewares/auth";

const router = express.Router()

router.route("/viewAll").get(verifyUser,admin.viewAllUser)
router.route("/removeUser/:id").delete(verifyUser, admin.removeUser)
router.route("/jobs").get(verifyUser, admin.jobList)
router.route("/removeJob/:id").delete(verifyUser,admin.removeJob)
router.route("/dash").get(verifyUser, admin.dashboardData)
router.route("/topW").get(verifyUser, admin.topWorker)
router.route("/topU").get(verifyUser,admin.topCustomers)

export default router