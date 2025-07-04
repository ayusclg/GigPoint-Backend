import { asyncHandler } from "../utils/AsyncHandler";
import { Request,Response } from "express";
import { uploadImageOnCloud } from "../middlewares/UploadImage";
import { Job } from "../models/jobModel";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiRes";
import { User } from "../models/userModel";

const createJob = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const creator = await User.findById(req.userId)
   if(!creator || creator.role === "worker") throw new ApiError(403,"Permission Denied")
    
    const { title, description, priceRange, priority } = req.body
    
    let cloudUrl;
    if (req.files) {
        const jobImages = req.files as Express.Multer.File[]
         cloudUrl = await uploadImageOnCloud(jobImages[0])
    }

    const createdJob = await Job.create({
        title,
        description,
        priceRange: {
            initial:isNaN(priceRange.initial)? Number(priceRange.initial):priceRange.initial,
            final:isNaN(priceRange.final)?Number(priceRange.final):priceRange.final,
        },
        priority,
        image: cloudUrl,
        createdBy:creator._id,
    })
    if (!createdJob) throw new ApiError(400, "Error In Creating Job")
    creator.jobPosted.push(createdJob._id as any)
    await creator.save()
    res.status(201).json(new ApiResponse(201,createdJob,"Job Created Successfully"))

})

const getJobById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await User.findById(req.userId)
    if (!user || user.role !== "worker") throw new ApiError(403, "Permission Denied You Must Be Worker")
    
    const jobId = req.params.id
    const job = await Job.findById(jobId).populate("createdBy", "fullName phoneNo address profilePicture").lean()
    if (!job) throw new ApiError(404, "Job Not Found")
    res.status(200).json(new ApiResponse(200,job,"Job Fetched Successfully"))
})

const deleteJob = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const jobId = req.params.id
    
    const job = await Job.findById(jobId)
    if (!job) throw new ApiError(404, "Job Details Not Found")
    if(job.createdBy.toString() !== req.userId) throw new ApiError(403,"You Cannot Delete")
    
    await Job.findByIdAndDelete(job._id)
    res.status(200).json(new ApiResponse(200,(job.title),"job Deleted Successfully"))
})

export{createJob,getJobById,deleteJob}