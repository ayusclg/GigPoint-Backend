import  express  from "express";
import { Upload } from "../middlewares/UploadImage";
import { getUserById, myProfile, userLogin, userLogout, userRegister } from "../controllers/userController";
import { verifyUser } from "../middlewares/auth";




const router = express.Router()
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management routes
 */ 


router.route("/create").post(Upload.single("profilePicture"), userRegister)
router.route("/login").post(userLogin)
router.route("/logout").post(verifyUser, userLogout)
router.route("/getById/:id").get(verifyUser, getUserById)
router.route("/my").get(verifyUser,myProfile)

export default router