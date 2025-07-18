import { User } from "../models/userModel";
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

const welcomeEmail = path.join(__dirname, "../templates/welcomeWorker.html");
const welcome = fs.readFileSync(welcomeEmail, "utf-8");

const workerRegister = asyncHandler(
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

    let experience;
    if (experienceYear) {
      const checkExperience = isNaN(experienceYear);
      if (checkExperience) {
        experience = Number(experienceYear);
      }
    }

    const userCreate = await User.create({
      email,
      phoneNo,
      fullName,
      password: hashedPw,
      profilePicture: cloudUrl,
      address,
      experienceYear: experience,
      skills,
      role: role || "worker",
      gender,
    });

    const userCreated = await User.findById(userCreate._id).select(
      "-password -refreshToken"
    );
    if (!userCreated) throw new ApiError(400, "Server Error In User Creation");

    const welcomeEmail = welcome.replace("{{fullname}}", fullName);
    const options = {
      to: email,
      subject: "Welcome To GigPoint !! ",
      html: welcomeEmail,
      message: "Under Dev soon Prod",
    };

    await sendMail(options);
    res
      .status(201)
      .json(new ApiResponse(201, userCreated, "User Account Created"));
  }
);

const workerLogin = asyncHandler(
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
    if (!accessToken || !refreshToken)
      throw new ApiError(404, "Tokens Not Generated");

    const userLogin = await User.findById(userExist._id).select(
      "-password -refreshToken"
    );
    if (!userLogin) throw new ApiError(400, "ErrorIN Getting loggedIn User");

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
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

const userLogout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
    });
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false,
    });
    res.status(200).json(new ApiResponse(200, " ", "User logged Out"));
  }
);

const getUserById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.params.id;

    const dbUser = await User.findById(user);
    if (!dbUser) throw new ApiError(404, "Requested User Not Found");
    let gotUser;
    if (dbUser.role === "worker") {
      gotUser = await User.findById(dbUser._id)
        .select("-password -refreshToken -googleId -jobPosted")
        .populate("jobDone", "ttile createdBy")
        .populate("rating", "point comment");
    } else {
      gotUser = await User.findById(dbUser._id)
        .select(
          "-password -skills -experienceYear -jobDone -googleId -refreshToken -isAvailable"
        )
        .populate("jobPosted", "title description status");
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, gotUser, `${dbUser.role} Fetched Successfully`)
      );
  }
);

const myProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userProfile = await User.findById(req.userId);
    if (!userProfile) {
      throw new ApiError(404, "User Not Found");
    }
    let user;
    userProfile.role === "worker"
      ? (user = await User.findById(userProfile._id)
          .select("-password -refreshToken -googleId -jobPosted")
          .populate("jobDone", "ttile createdBy")
          .populate("rating", "point comment"))
      : (user = await User.findById(userProfile._id)
          .select(
            "-password -skills -experienceYear -jobDone -googleId -refreshToken -isAvailable"
          )
          .populate("jobPosted", "title description status"));

    res
      .status(200)
      .json(new ApiResponse(200, user, "User Fetched Successfully"));
  }
);

const updateWorkerDetails = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { address, phoneNo, skills, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user) throw new ApiError(403, "User Not Found");

    if (skills) {
      if (!Array.isArray(skills))
        throw new ApiError(400, "Skills Must Be Array");
    }
    const checkPassword = await bcrypt.compare(
      currentPassword,
      user.password as string
    );
    if (!checkPassword)
      throw new ApiError(403, "Please Enter Correct Current Password");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    let cloudUrl;
    if (req.file) {
      const file = req.file as Express.Multer.File;
      cloudUrl = await uploadImageOnCloud(file);
    }
    if (address) user.address = address;
    if (phoneNo) user.phoneNo = phoneNo;
    if (skills) user.skills = skills;
    if (newPassword) user.password = hashedPassword;
    if (cloudUrl) user.profilePicture = cloudUrl;
    await user.save();
    res.status(200).json(new ApiResponse(200, user, "User Detail Updated"));
  }
);

const searchWorker = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const filter = (req.query.filter as string) ;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 4;
    const sortOption = (req.query.sortOption as string) || "createdAt";

    const query = filter ? filterQuery(filter) : {}
    query.role = "worker";
    const totalDocuments = await User.countDocuments(query);
    if (!totalDocuments) throw new ApiError(404, "No Worker found");
    console.log(query)
    const limit = perPage
    const skip = (page-1) *perPage

    const result = await User.find(query)
      .select(
        "-password -refreshToken -email -phoneNo -jobPosted -jobDone -experienceYear -isAvailable -jobApplied"
      )
      .sort({ [sortOption]: 1 }).skip(skip).limit(limit)
      .lean();
    
    const response = {
      page,
      perPage,
      totalDocuments,
      result,
    }
    res.status(200).json(new ApiResponse(200,response,"Search Successfull"))
  }
);

export {
  workerRegister,
  workerLogin,
  userLogout,
  getUserById,
  myProfile,
  updateWorkerDetails,
  searchWorker
};
