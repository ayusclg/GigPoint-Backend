import { Iuser, User } from "../models/userModel";
import { asyncHandler } from "../utils/AsyncHandler";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { uploadImageOnCloud } from "../middlewares/UploadImage";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiRes";
import path from "path";
import fs from "fs";
import { sendMail } from "../services/Nodemailer";
import { filterQuery } from "../middlewares/filterQuery";
import { isWorker } from "../utils/Rolecheck";
import { Job } from "../models/jobModel";
import { Application } from "../models/applicationModel";
import { logger } from "../Logger";
import mongoose from "mongoose";
import jwt, { JwtPayload } from 'jsonwebtoken'

const welcomeEmailPath = path.join(
  __dirname,
  "../templates/welcomeWorker.html"
);
const welcomeTemplate = fs.readFileSync(welcomeEmailPath, "utf-8");

const forgotPasswordPath = path.join(
  __dirname,
  "../templates/forgotPassword.html"
);
const forgotPasswordTemplate = fs.readFileSync(forgotPasswordPath, "utf-8");

class UserController {
  workerRegister = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const {
        fullName,
        email,
        password,
        address,
        phoneNo,
        experienceYear,
        skills,
        gender,
        role,
      } = req.body;

      const userExist = await User.findOne({ email });
      if (userExist) throw new ApiError(502, "Please Login");

      const hashedPw = await bcrypt.hash(password, 12);
      const file = req.file as Express.Multer.File;
      const cloudUrl = await uploadImageOnCloud(file);

      const userCreate = await User.create({
        email,
        phoneNo,
        fullName,
        password: hashedPw,
        profilePicture: cloudUrl,
        address,
        experienceYear: Number(experienceYear),
        skills,
        role: role || "worker",
        gender,
      });

      const userCreated = await User.findById(userCreate._id).select(
        "-password -refreshToken"
      );
      if (!userCreated)
        throw new ApiError(400, "Server Error In User Creation");

      const welcomeHtml = welcomeTemplate.replace("{{fullname}}", fullName);
      await sendMail({
        to: email,
        subject: "Welcome To GigPoint !!",
        html: welcomeHtml,
        message: "Under Dev soon Prod",
      });

      res
        .status(201)
        .json(new ApiResponse(201, userCreated, "User Account Created"));
    }
  );

  workerLogin = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email, password } = req.body;
      if (!email || !password) throw new ApiError(403, "Access Forbidden");

      const userExist = await User.findOne({ email });
      if (!userExist?.password) throw new ApiError(401, "Please Register");

      const checkPW = await bcrypt.compare(password, userExist.password);
      if (!checkPW)
        throw new ApiError(403, "Permission Denied (Incorrect Password)");

      const refreshToken = userExist.generateRefreshToken();
      const accessToken = userExist.generateAccessToken();

      const userLogin = await User.findById(userExist._id).select(
        "-password -refreshToken"
      );
      if (!userLogin) throw new ApiError(400, "ErrorIN Getting loggedIn User");

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "./api",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "./api",
      });

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { userLogin, accessToken, refreshToken },
            "User Successfully LoggedIn"
          )
        );
    }
  );

  userLogout = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "./api",
      });
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "./api",
      });
      res.status(200).json(new ApiResponse(200, "", "User logged Out"));
    }
  );

  getUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.params.id;
      const dbUser = await User.findById(user);
      if (!dbUser) throw new ApiError(404, "Requested User Not Found");

      const response: Record<string, any> = {};
      if (isWorker(dbUser)) {
        const gotUser = await User.findById(dbUser._id)
          .select("-password -refreshToken -googleId -jobPosted")
          .populate("jobDone", "title createdBy")
          .populate("rating", "point comment");

        response["JobsDone"] = await Job.countDocuments({
          assignedTo: dbUser._id,
        });
        response["JobsApplied"] = await Application.countDocuments({
          appliedBy: dbUser._id,
        });
        response["Worker"] = gotUser;
      } else {
        const gotUser = await User.findById(dbUser._id)
          .select(
            "-password -skills -experienceYear -jobDone -googleId -refreshToken -isAvailable"
          )
          .populate("jobPosted", "title description status");

        response["JobPosted"] = await Job.countDocuments({
          createdBy: dbUser._id,
        });
        response["User"] = gotUser;
      }

      res
        .status(200)
        .json(
          new ApiResponse(200, response, `${dbUser.role} Fetched Successfully`)
        );
    }
  );

  myProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userProfile = await User.findById(req.userId);
      if (!userProfile) throw new ApiError(404, "User Not Found");

      const response: Record<string, any> = {};
      response["JoinedOn"] = new Date(userProfile.createdAt).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "short", day: "numeric" }
      );

      if (isWorker(userProfile)) {
        const worker = await User.findById(userProfile._id)
          .select(
            "-password -refreshToken -googleId -jobPosted -resetOtp -resetOtpExpiry"
          )
          .populate("jobDone", "title createdBy")
          .populate("rating", "point comment");

        response["JobsDone"] = await Job.countDocuments({
          assignedTo: userProfile._id,
        });
        response["JobsApplied"] = await Application.countDocuments({
          appliedBy: userProfile._id,
        });
        response["Worker"] = worker;
      } else {
        const user = await User.findById(userProfile._id)
          .select(
            "-password -skills -experienceYear -jobDone -googleId -refreshToken -isAvailable"
          )
          .populate("jobPosted", "title description status");
        response["JobPosted"] = await Job.countDocuments({
          createdBy: userProfile._id,
        });
        response["User"] = user;
      }

      res
        .status(200)
        .json(new ApiResponse(200, response, "User Fetched Successfully"));
    }
  );

  updateWorkerDetails = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { address, phoneNo, skills, currentPassword, newPassword } =
        req.body;
      const user = await User.findById(req.userId);
      if (!user) throw new ApiError(403, "User Not Found");

      if (skills && !Array.isArray(skills))
        throw new ApiError(400, "Skills Must Be Array");
      if (
        currentPassword &&
        !(await bcrypt.compare(currentPassword, user.password as string))
      )
        throw new ApiError(403, "Please Enter Correct Current Password");

      if (newPassword) user.password = await bcrypt.hash(newPassword, 10);
      if (req.file)
        user.profilePicture = await uploadImageOnCloud(
          req.file as Express.Multer.File
        );
      if (address) user.address = address;
      if (phoneNo) user.phoneNo = phoneNo;
      if (skills) user.skills = skills;

      await user.save();
      res.status(200).json(new ApiResponse(200, user, "User Detail Updated"));
    }
  );

  searchWorker = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const filter = req.query.filter as string;
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 4;
      const sortOption = (req.query.sortOption as string) || "createdAt";

      const query = filter ? filterQuery(filter) : {};
      query.role = "worker";
      const totalDocuments = await User.countDocuments(query);
      if (!totalDocuments) throw new ApiError(404, "No Worker found");

      const result = await User.find(query)
        .select(
          "-password -refreshToken -email -phoneNo -jobPosted -jobDone -experienceYear -isAvailable -jobApplied"
        )
        .sort({ [sortOption]: 1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean();

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { page, perPage, totalDocuments, result },
            "Search Successful"
          )
        );
    }
  );

  forgotPassword = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user || !isWorker(user))
        throw new ApiError(404, "User Not Found or Unauthorized");

      const otp = Math.floor(Math.random() * 900000 + 100000).toString();
      user.resetOtp = otp;
      user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const html = forgotPasswordTemplate
        .replace("{{username}}", user.fullName.split(" ")[0])
        .replace("{{otp}}", otp);
      await sendMail({
        to: user.email,
        subject: "GigPoint Password Reset",
        html,
        message: "under dev soon prod",
      });

      res.status(200).json(new ApiResponse(200, "", "Password Reset Otp Sent"));
    }
  );

  verifyOtp = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email, otp } = req.body;
      const user = await User.findOne({ email });
      if (
        !user ||
        otp !== user.resetOtp ||
        !user.resetOtpExpiry ||
        user.resetOtpExpiry < new Date()
      )
        throw new ApiError(403, "Invalid or Expired OTP");

      res
        .status(200)
        .json(new ApiResponse(200, "", "OTP verified Successfully"));
    }
  );

  resetPassword = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email, otp, newPassword } = req.body;
      const user = await User.findOne({ email });
      if (
        !user ||
        user.resetOtp !== otp ||
        !user.resetOtpExpiry ||
        user.resetOtpExpiry < new Date()
      )
        throw new ApiError(400, "Invalid OTP or Expired");

      if (await bcrypt.compare(newPassword, user.password as string))
        throw new ApiError(400, "Old Passwords Cannot Be Used");

      user.password = await bcrypt.hash(newPassword, 10);
      user.resetOtp = undefined;
      user.resetOtpExpiry = undefined;
      await user.save();

      const changedUser = await User.findById(user._id).select(
        "-password -refreshToken -resetOtp -resetOtpExpiry"
      );
      res
        .status(200)
        .json(new ApiResponse(200, changedUser, "User Password Changed"));
    }
  );

  makeAvailable = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { isAvailable } = req.body;
      const user = await User.findById(req.userId);
      if (!user || !isWorker(user))
        throw new ApiError(403, "You Are Not Allowed");

      user.isAvailable = isAvailable;
      await user.save();
      res
        .status(200)
        .json(new ApiResponse(200, user, "User Availability Changed"));
    }
  );

  addUserAddress = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { address } = req.body;
      const user = await User.findById(req.userId);
      if (!user || isWorker(user)) throw new ApiError(403, "Permission Denied");

      user.address = address;
      await user.save();
      res.status(200).json(new ApiResponse(200, user, "User Address Added"));
    }
  );

  workerReports = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = await User.findById(req.userId);
      if (!user || !isWorker(user))
        throw new ApiError(403, "You Are Not Allowed");

      const data = await Job.aggregate([
        { $match: { assignedTo: new mongoose.Types.ObjectId(req.userId) } },
        { $group: { _id: null, totalEarning: { $sum: "$finalPrice" } } },
      ]);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { totalEarning: data[0]?.totalEarning || 0 },
            "Worker Reports Fetched Successfully"
          )
        );
    }
  );

  myRecentWorkers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = await User.findById(req.userId);
      if (!user || isWorker(user)) throw new ApiError(403, "Permission Denied");

      const jobs = await Job.find({ createdBy: user._id })
        .populate("assignedTo", "fullName profilePicture address email")
        .sort({ createdAt: "desc" })
        .limit(5);

      const workers: Iuser[] = [];
      for (const job of jobs)
        if (job.assignedTo && !workers.includes(job.assignedTo as any))
          workers.push(job.assignedTo as any);

      res
        .status(200)
        .json(new ApiResponse(200, workers, "Recent Workers Fetched"));
    }
  );

  myCompletedJobs = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userCheck = await User.findById(req.userId);
      if (!userCheck || !isWorker(userCheck))
        throw new ApiError(403, "Permission Denied");

      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 5;
      const completedJobs = await Job.find({ assignedTo: userCheck })
        .select("title createdAt createdBy priority address")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .sort({ createdAt: "asc" })
        .exec();

      if (!completedJobs) throw new ApiError(404, "No completed Jobs Found");
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            completedJobs,
            "Completed Jobs Fetched Successfully"
          )
        );
    }
  );

    regenerateAccessToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const token = req.headers.authorization?.startsWith("Bearer") ? req.headers.authorization.split(" ")[1] : req.cookies.refreshToken;
      if (!token) {
        throw new ApiError(404,"No Token Found")
      }
      try {
        const verifyToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload
        const decodeToken = await User.findById(verifyToken._id)
        const newAccessToken = await decodeToken?.generateAccessToken()
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          path:"/"
        })
        res.status(200).json(new ApiResponse(200,newAccessToken,"AccessToken Generated"))
      } catch (error) {
        throw new ApiError(500,"Invalid Token Request")
      }
    })
  }


export const userController = new UserController();
