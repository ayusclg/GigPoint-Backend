import express from "express";
import { admin } from "../controllers/adminController";
import { verifyUser } from "../middlewares/auth";

const router = express.Router()

router.route("/viewAll").get(verifyUser,admin.viewAllUser)

export default router