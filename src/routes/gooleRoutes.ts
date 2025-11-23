// routes/googleRoutes.ts
import express from "express";
import passport from "passport";
import { AuthController } from "../controllers/googleController";

const router = express.Router();
const googleController = new AuthController();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "'http://localhost:5173/login'",
  }),
  googleController.googleCallback.bind(googleController)
);

export default router;
