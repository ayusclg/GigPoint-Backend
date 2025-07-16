import { asyncHandler } from "../utils/AsyncHandler";
import { Request,Response } from "express";
import { uploadImageOnCloud } from "../middlewares/UploadImage";
import { Job } from "../models/jobModel";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiRes";
import { User } from "../models/userModel";
import { Application, Iapply } from "../models/applicationModel";
import path from "path";
import fs from "fs";
import { sendMail } from "../services/Nodemailer";

const applyEmail = path.join(__dirname, '../templates/jobApply.html')
const apply = fs.readFileSync(applyEmail,"utf-8")

const approveEmail = path.join(__dirname, '../templates/jobApprove.html')
const approve = fs.readFileSync(approveEmail,'utf-8')

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
            end:isNaN(priceRange.end)?Number(priceRange.end):priceRange.end,
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
    if (!user  ) throw new ApiError(403, "No User Found")
    
    const jobId = req.params.id
    const job = await Job.findById(jobId)
      .populate("createdBy", "fullName phoneNo address profilePicture")
      .populate("assignedTo", "fullName address phoneNo")
      .lean();
    if (!job) throw new ApiError(404, "Job Not Found")
    if(user.role !== "worker" && job.createdBy._id.toString() !== user._id.toString()) throw new ApiError(403,"You cannot view")
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
    const job = await Job.findById(req.params.id).populate("createdBy" ,"email")
    if (!job) throw new ApiError(404, "Job Not Found")
    
    const user = await User.findById(req.userId)
    if (!user || !user.isAvailable ) throw new ApiError(404, "Please mark yourself as available")
    
    
        const {estimatedPrice} =req.body
    const application = await Application.findOne({ jobId: job._id, appliedBy: req.userId })
    if(application) throw new ApiError(403,"Twice cant be Applied")
   if(job.assignedTo) throw new ApiError(403,"Job Already Assigned")
    let applyJob:Iapply;
    if (user.role === "worker") {
      
        const skillsMatch = job.skills.some((sk: string) => user.skills.includes(sk))
        
        if (!skillsMatch ) throw new ApiError(403, "Your Skills Dont Match")
        
         applyJob = await Application.create({
            jobId: job._id,
            appliedBy: req.userId,
             message: req.body.message,
            estimatedPrice:Number(estimatedPrice),
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
    const applyHtml = apply.replace("{{workerName}}", user.fullName)
                            .replace("{{jobTitle}}", job.title);
    const options = {
        to: (job.createdBy as any).email,
        subject: "Your Job Posting Has An Application",
        html:applyHtml,
        message:"Under Dev soon Prod"
    }
    await sendMail(options)
   res.status(201).json(new ApiResponse(201,applyJob,"Job Application Created"))
    
    })

const approveJobApplication = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { applicationId } = req.body
    const user = await User.findById(req.userId) 
    if (!user) throw new ApiError(404, "User Not Found")
    
    const job = await Job.findById(req.params.id).populate("assignedTo","fullName address phoneNo email profilePicture")
    if (!job) throw new ApiError(404, "Job Not Found")
    
    
     const application = await Application.findById(applicationId).populate("appliedBy","fullname isAvailable email")
     if(!application) throw new ApiError(404,"No Application Found")  
  
    if (user.role == "worker" || job.createdBy.toString() !== req.userId) throw new ApiError(403, "You Are Not Allowed") 
        if(job.assignedTo) throw new ApiError(403,"Job Already Assigned")
    job.assignedTo = application.appliedBy
    job.status = "assigned"
    job.finalPrice = application.estimatedPrice
    await job.save()
    application.isAccepted = true; 
    await application.save(); 
    
    const workerId = application.appliedBy._id;
    const worker = await User.findById(workerId)
    if(!worker) throw new ApiError(404,"Worker Not Found")
    await User.findByIdAndUpdate(workerId, { isAvailable: false });
    const approveHtml = approve.replace('{{title}}', job.title);

    const options = {
        to: worker.email,
        subject: "Your Job Application Has Been Approved",
        html: approveHtml,
        message: "Under Dev soon Prod"
        
    }
    await sendMail(options)
    res.status(200).json(new ApiResponse (200,{job,application},"Job Application Approved"))
})

const viewAllApplication = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userCheck = await User.findById(req.userId)
    if (!userCheck) throw new ApiError(404, "no user found")
    let allApplications;
 

    if (userCheck.role !== "worker" ) {
        allApplications = await Application.findOne({ jobId: req.params.id }).populate("appliedBy", "fullName email address phoneNo skills experienceYear ratings")   
        if (!allApplications) throw new ApiError(404, "No applicants found")
      
    }
    else {
        throw new ApiError(403,"Permission Denied")
    }
    res.status(200).json(new ApiResponse(200,{allApplications},"Applications Fetched"))
})

const getMyJobs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    
    const myJobsPost = await Job.find({ createdBy: req.userId }).populate("assignedTo", "fullName address phoneNo").lean()
    if (!myJobsPost || myJobsPost.length === 0) throw new ApiError(404, "No Jobs Found")

    const totalDocument = await Job.countDocuments({createdBy:req.userId})
    if (totalDocument === 0) throw new ApiError(404, "No Documents")
    
    res.status(200).json(new ApiResponse(200,{myJobsPost, totalDocument },"All Jobs Fetched"))
})


const getSingleApplication = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const applicationId = req.params.id
    const application = await Application.findById(applicationId).populate("jobId","createdBy")
    if (!application) throw new ApiError(404, "No Application Found")
    if (application.appliedBy.toString() !== req.userId && (application.jobId as any).createdBy.toString() !== req.userId)
        throw new ApiError(403, "You are not allowed")
    
    res.status(200).json(new ApiResponse(200,application,"Application Fetched Successfully"))
})

const viewMyApplications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1
    const perPage = parseInt(req.query.perPage as string) || 5
    const sortOption = req.query.sortOption as string || 'status'

    const userCheck = await User.findById(req.userId)
    if (!userCheck || userCheck.role !== 'worker') throw new ApiError(403, "User Have No Permission")
    
     const totalApplications = await Application.countDocuments({
       appliedBy: userCheck._id,
     });
     if (totalApplications == 0) throw new ApiError(404, "0 Applications");
    
    const skip = (Number(page) - 1) * Number(perPage)
    
    const myApplications = await Application.find({ appliedBy: userCheck._id }).sort({[sortOption]:1}).skip(skip).limit(perPage).populate("jobId","title skills ").lean()
    if (myApplications == null) throw new ApiError(404, "No Applications Found") 
    
    const response = {
        totalApplications,
        myApplications,
        page,
        perPage,
    }
    res.status(200).json(new ApiResponse(200,response,"Applications Fetched Successfully"))
})

const searchJob = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const title = req.query.title as string || " "
    const page = parseInt(req.query.page as string) || 1
    const perPage = parseInt(req.query.perPage as string) || 4
    const sortOption = req.query.sortOption as string

    const user = await User.findById(req.userId)
    if(!user || user.role !== "worker") throw new ApiError(403,"Only Workers Can Search Job")

    let query: Record<string, any> = {};
    query.title = new RegExp(title,"i")
    const countQuery = await Job.countDocuments(query)
    if (countQuery == null) throw new ApiError(404, "No Jobs Found")
    
    const skip = (page-1) *perPage 
    const result = await Job.find(query).sort({[sortOption]:1}).select("-skills  -assignedTo -applications -finalPrice").skip(skip).limit(perPage).lean()
    
    const response = {
        page,
        perPage,
        result,
        totalJobs:countQuery
    }
    res.status(200).json(new ApiResponse(200,response,"Job Search Done"))
    
})

export{createJob,getJobById,deleteJob,approveJobApplication,applyJob,viewAllApplication,getMyJobs,getSingleApplication,viewMyApplications,searchJob}