import { User } from "../models/userModel";
import { asyncHandler } from "../utils/AsyncHandler";
import { Request, Response } from "express";
import bcrypt from 'bcrypt'
import { uploadImageOnCloud } from "../middlewares/UploadImage";
import {ApiError }from '../utils/ApiError'
import { ApiResponse } from "../utils/ApiRes";



const userRegister = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { fullName, email, password, address, phoneNo, experienceYear, skills,gender,role } = req.body
    
    const userExist = await User.findOne({ email, })
    if (userExist) throw new ApiError(502, "Please Login")
    
    const hashedPw  = await bcrypt.hash(password, 12) 
   
    
        const file = req.file as Express.Multer.File
       const  cloudUrl = await uploadImageOnCloud(file)
    
    let experience;
    if(experienceYear)
    {
        const checkExperience = isNaN(experienceYear)
        if (checkExperience) {
            experience = Number(experienceYear)
        }
    }

    const userCreate = await User.create({
        email,
        phoneNo,
        fullName,
        password: hashedPw,
        profilePicture: cloudUrl,
        address,
        experienceYear:experience,
        skills, 
        role: role ||"worker",
        gender,
    })

    const userCreated = await User.findById(userCreate._id).select("-password -refreshToken")
    if(!userCreated) throw new ApiError(400,"Server Error In User Creation")

    res.status(201).json(new ApiResponse(201, userCreated, "User Account Created"))
})


const userLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body
    if (!email || !password) throw new ApiError(403, "Access Forbidden")
    
    const userExist = await User.findOne({ email, })
    if (!userExist?.password) throw new ApiError(401, "Please Register")
    
    const checkPW = await bcrypt.compare(password, userExist.password)
    if(!checkPW) throw new ApiError(403,"Permission Denied (Incorrect Password)")
    
    const refreshToken = userExist.generateRefreshToken()
    const accessToken = userExist.generateAccessToken()
    if(!accessToken || !refreshToken) throw new ApiError(404,"Tokens Not Generated")
    
    const userLogin = await User.findById(userExist._id).select("-password -refreshToken")
    if (!userLogin) throw new ApiError(400, "ErrorIN Getting loggedIn User")
    
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure:false,
    })
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure:false
    })
    res.status(200).json(new ApiResponse(200, { userLogin,accessToken,refreshToken },"User Successfully LoggedIn"))
    
})

const userLogout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure:false,
    })
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure:false,
    })
    res.status(200).json(new ApiResponse(200," ","User logged Out"))
})

const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.params.id
    
    const dbUser = await User.findById(user)
    if (!dbUser) throw new ApiError(404, "Requested User Not Found")
    let gotUser;
    if (dbUser.role === "worker") {
        gotUser = await User.findById(dbUser._id).select("-password -refreshToken -googleId -jobPosted")
        .populate("jobDone" ,"ttile createdBy")
    }
    else {
        gotUser = await User.findById(dbUser._id).select("-password -skills -experienceYear -jobDone -googleId -refreshToken").populate("jobPosted","title description status")
    }
    res.status(200).json(new ApiResponse(200,gotUser,`${dbUser.role} Fetched Successfully`))

})

const myProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userProfile = await User.findById(req.userId).populate("jobDone", "title ").populate("jobPosted", "title address description").lean()
    if (!userProfile) throw new ApiError(404, "User Not Found")
    res.status(200).json(new ApiResponse(200,userProfile,"User Fetched Successfully"))
})

const userHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    
})
export {userRegister,userLogin,userLogout,getUserById,myProfile}