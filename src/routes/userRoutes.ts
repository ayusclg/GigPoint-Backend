import  express  from "express";
import { Upload } from "../middlewares/UploadImage";
import { userLogin, userLogout, userRegister } from "../controllers/userController";
import { verifyUser } from "../middlewares/auth";

const router = express.Router()

router.route("/create").post(Upload.single("profilePictue"), userRegister)
router.route("/login").post(userLogin)
router.route("/logout").get(verifyUser,userLogout)

export default router