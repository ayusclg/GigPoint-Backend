import { filterQuery } from "../middlewares/filterQuery";
import { User } from "../models/userModel";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiRes";
import { asyncHandler } from "../utils/AsyncHandler"
import { Request,Response } from "express"
import { isAdmin } from "../utils/Rolecheck";
import { Job } from "../models/jobModel";

class adminController {

    viewAllUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userCheck = await User.findById(req.userId)
        if (!userCheck || !isAdmin(userCheck)) {
            throw new ApiError(403, "permission denied only admin allowed")
        }
        
        const filter = req.query.filter as string || " ";
    
        const sortOption = req.query.sortOption as string || "createdAt"
        const page = parseInt(req.query.page as string) || 1
        const perPage = parseInt(req.query.perPage as string) || 10
        
        const skip = (page - 1) * perPage
        const limit = perPage
        
        const query: Record<string, any> = filter ? filterQuery(filter) : {}
        const viewAll = await User.find(query).sort(sortOption).skip(skip).limit(limit).select("email fullName profilePicture address phoneNo role gender  createdAt")

        if (viewAll.length === 0) {
            throw new ApiError(404, "No Details Found")
        }

        res.status(200).json(new ApiResponse(200, viewAll))
    })

    removeUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userCheck = await User.findById(req.userId)
        if (!userCheck || !isAdmin(userCheck)) {
            throw new ApiError(403, "Permission Denied Only ADMIN Allowed")
        }

        const userId = req.params.id

        const removeUser = await User.findById(userId)
        if (!removeUser || isAdmin(removeUser)) {
            throw new ApiError(404, "User CouldNot Be Deleted");
        }

        await User.findByIdAndDelete(userId)
        
        res.status(200).json(new ApiResponse(200, removeUser, "User Successfully Deleted"))
    })

    jobList = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const userCheck = await User.findById(req.userId)
        if (!userCheck || !isAdmin(userCheck)) {
            throw new ApiError(403, "Permission Denied")
        }
        const filter = req.query.filter as string
        const perPage = parseInt(req.query.perPage as string) || 10
        const page = parseInt(req.query.page as string) || 1

        const skip = (page - 1) * perPage
        const limit = perPage
        const query = filter ? filterQuery(filter) : {};
        const allJobs = await Job.find(query).skip(skip).limit(limit).sort({ "createdAt": "asc" }).select("title description createdBy status assignedTo address createdAt ").lean()
        const totalJobs = await Job.countDocuments(query);
        if (totalJobs === 0) {
            throw new ApiError(404, "No Jobs In The Database")
        }

        const response = {
            jobs: allJobs,
            page: page,
            total: totalJobs
        }
        res.status(200).json(new ApiResponse(200, response, "Job List Fetched"))
         
         

    })
    
}
export const admin = new adminController()