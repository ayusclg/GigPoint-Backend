import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { Iuser } from "../models/userModel";
import { ApiError } from "../utils/ApiError";

export class AuthController {
  public googleCallback = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user as Iuser;
      console.log(user);  
     
      if (!user) {
        return res.redirect(
          `http://localhost:5173/login?error=Authentication+failed`
        );
      }

       
     if (user.role === "worker") {
       return res.redirect(
         `http://localhost:5173/login?error=This+Google+account+is+already+registered+as+a+Service+Provider.+Please+use+email/password+login+instead.`
       );
     }

      const refreshToken = user.generateRefreshToken();
      const accessToken = user.generateAccessToken();

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        path: "/",
        sameSite: "none",
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });

      res.redirect(
        `http://localhost:5173/oauth-success?accessToken=${accessToken}&refreshToken=${refreshToken}`
      );
    }
  );
}
