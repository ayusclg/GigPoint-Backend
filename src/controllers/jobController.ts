import { asyncHandler } from "../utils/AsyncHandler";
import { Request,Response } from "express";
import { uploadImageOnCloud } from "../middlewares/UploadImage";
import { Job } from "../models/jobModel";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiRes";
import { User } from "../models/userModel";
import { Application, Iapply } from "../models/applicationModel";
import mongoose from "mongoose";

const createJob = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const creator = await User.findById(req.userId)
   if(!creator || creator.role === "worker") throw new ApiError(403,"Permission Denied")
    
    const { title, description, priceRange, priority,skills } = req.body
    
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
        createdBy: creator._id,
        skills,
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

    const user = await User.findById(req.userId)
    if (!user) throw new ApiError(404, "User Not Found");

    const removedId = user.jobPosted.filter((id) => id.toString() !== jobId.toString())
    console.log(removedId)
    user.jobPosted = removedId
    await user.save()
    res.status(200).json(new ApiResponse(200,(job.title),"job Deleted Successfully"))
})

const applyJob = asyncHandler(async (req: Request, res: Response):Promise<void> => {
    const job = await Job.findById(req.params.id)
    if (!job) throw new ApiError(404, "Job Not Found")
    
    const user = await User.findById(req.userId)
    if (!user) throw new ApiError(404, "User Not Found")
    
 
    const application = await Application.findOne({ jobId: job._id, appliedBy: req.userId })
    if(application) throw new ApiError(403,"Twice cant be Applied")
   
    let applyJob:Iapply;
    if (user.role === "worker") {
      
        const skillsMatch = job.skills.some((sk: string) => user.skills.includes(sk))
        
        if (!skillsMatch ) throw new ApiError(403, "Your Skills Dont Match")
        
         applyJob = await Application.create({
            jobId: job._id,
            appliedBy: req.userId,
            message:req.body.message,
        })
        if (!applyJob) throw new ApiError(400, "Job Application Not Created")
            user.jobApplied.push(applyJob._id as any)
        await user.save()
        job.applications.push(applyJob._id as any)
        await job.save()
    }
    else {
        throw new ApiError(403,"Permission Denied")
    }
  

   res.status(201).json(new ApiResponse(201,applyJob,"Job Application Created"))
    
    })

const approveJobApplication = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { applicantId } = req.body
    const user = await User.findById(req.userId) 
    if (!user) throw new ApiError(404, "User Not Found")
    
    const job = await Job.findById(req.params.id).populate("assignedTo","fullName address phoneNo email profilePicture")
    if (!job) throw new ApiError(404, "Job Not Found")
     
  
    
    
    if (user.role == "worker" || job.createdBy.toString() !== req.userId) throw new ApiError(403, "You Are Not Allowed") 
    
    const approveJob = await Application.findOne({ jobId: job._id })
    if (!approveJob) throw new ApiError(404, "No Applications Yet")
    
    if ((approveJob.appliedBy as any).includes(applicantId)) {
        job.assignedTo = applicantId
        await job.save()
    } else { throw new ApiError(404, "No such Applicant found") }

    job.status = "assigned"
    await job.save()

    res.status(200).json(new ApiResponse (200,job,"Job Application Approved"))
})
const viewAllApplication = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userCheck = await User.findById(req.userId)
    if (!userCheck) throw new ApiError(404, "no user found")
    let allApplications;
    let totalApplications;

    if (userCheck.role !== "worker") {
        allApplications = await Application.findOne({ jobId: req.params.id }).populate("appliedBy", "fullName email address phoneNo skills experienceYear ratings")   
        if (!allApplications) throw new ApiError(404, "No applicants found")
       totalApplications = await Application.countDocuments(allApplications.appliedBy)
    }
    else {
        throw new ApiError(403,"Permission Denied")
    }
    res.status(200).json(new ApiResponse(200,{allApplications,totalApplications},"Applications Fetched"))
})
export{createJob,getJobById,deleteJob,approveJobApplication,applyJob,viewAllApplication}