import { asyncHandler } from "../utils/AsyncHandler";
import { Request, Response } from "express";
import { Iuser } from "../models/userModel";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiRes";

const googleCallback = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as Iuser;
    if (!user) throw new ApiError(403, "Permission Denied");
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
    });

    res.status(201).json(new ApiResponse(200, user, "User Logged In"));
  }
);

export { googleCallback };
