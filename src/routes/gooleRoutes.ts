import express from "express"
import passport from "passport"
import { googleCallback } from "../controllers/googleController"


const router = express.Router()
router.get("/google", passport.authenticate("google", {
    scope:["profile","email"]
}))

router.get("/googleCallback",passport.authenticate("google",{session:false,failureRedirect:"/login"}),googleCallback)
export default router
