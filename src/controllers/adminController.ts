import { filterQuery } from "../middlewares/filterQuery";
import { User } from "../models/userModel";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiRes";
import { asyncHandler } from "../utils/AsyncHandler";
import { Request, Response } from "express";
import { isAdmin } from "../utils/Rolecheck";
import { Job } from "../models/jobModel";
import bcrypt from "bcrypt";
import { Admin } from "mongodb";
import { sendMail } from "../services/Nodemailer";
import path from "path";
import fs from "fs";

const removeUserHTML = path.join(__dirname, "../templates/removeUser.html");
const removeUserTemplate = fs.readFileSync(removeUserHTML, "utf-8");

const removeJobHTML = path.join(__dirname, "../templates/removeJob.html");
const removeJobTemplate = fs.readFileSync(removeJobHTML, "utf-8");
class adminController {
  viewAllUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userCheck = await User.findById(req.userId);
      if (!userCheck || !isAdmin(userCheck)) {
        throw new ApiError(403, "permission denied only admin allowed");
      }

      const filter = (req.query.filter as string) || " ";

      const sortOption = (req.query.sortOption as string) || "createdAt";
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 10;

      const skip = (page - 1) * perPage;
      const limit = perPage;

      const query: Record<string, any> = filter ? filterQuery(filter) : {};
      const viewAll = await User.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select(
          "email fullName profilePicture address phoneNo role gender  createdAt"
        );

      if (viewAll.length === 0) {
        throw new ApiError(404, "No Details Found");
      }

      res.status(200).json(new ApiResponse(200, viewAll));
    }
  );

  removeUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userCheck = await User.findById(req.userId);
      if (!userCheck || !isAdmin(userCheck)) {
        throw new ApiError(403, "Permission Denied Only ADMIN Allowed");
      }

      const userId = req.params.id;
      const { message } = req.body;

      const removeUser = await User.findById(userId);
      if (!removeUser || isAdmin(removeUser)) {
        throw new ApiError(404, "User CouldNot Be Deleted");
      }
      if (isAdmin(removeUser)) {
        throw new ApiError(400, "Bad Request Cannot Delete Admin");
      }
      const userMail = removeUser.email;
      const userName = removeUser.fullName;
      const html = removeUserTemplate
        .replace("{{username}}", userName)
        .replace(
          "{{body}}",
          message ||
            "we are sorry for this convinence that arised due to your inappropriate use of the platform."
        );
      const deleteUser = await User.findByIdAndDelete(userId);
      if (deleteUser) {
        const mailOptions = {
          to: userMail,
          subject: "You Are Restricted To Use GigPoint",
          message: "You Are Restricted To Use GigPoint",
          html,
        };
        const mailRes = await sendMail(mailOptions);
        if (!mailRes) {
          throw new ApiError(400, "Error In Sending Mail");
        }
      } else {
        throw new ApiError(400, "Error In Deleting User");
      }
      res
        .status(200)
        .json(new ApiResponse(200, removeUser, "User Successfully Deleted"));
    }
  );

  jobList = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userCheck = await User.findById(req.userId);
    if (!userCheck || !isAdmin(userCheck)) {
      throw new ApiError(403, "Permission Denied");
    }
    const filter = req.query.filter as string;
    const perPage = parseInt(req.query.perPage as string) || 10;
    const page = parseInt(req.query.page as string) || 1;

    const skip = (page - 1) * perPage;
    const limit = perPage;
    const query = filter ? filterQuery(filter) : {};
    const allJobs = await Job.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: "asc" })
      .select(
        "title description createdBy status assignedTo address createdAt "
      )
      .populate("createdBy", "fullName profilePicture")
      .lean();
    const totalJobs = await Job.countDocuments(query);
    if (totalJobs === 0) {
      throw new ApiError(404, "No Jobs In The Database");
    }

    const response = {
      jobs: allJobs,
      page: page,
      total: totalJobs,
    };
    res.status(200).json(new ApiResponse(200, response, "Job List Fetched"));
  });

  removeJob = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userCheck = await User.findById(req.userId);
      if (!userCheck || !isAdmin(userCheck)) {
        throw new ApiError(403, "Permission Denied");
      }

      const jobId = req.params.id;
      const { message } = req.body;

      const findJob = await Job.findById(jobId).populate(
        "createdBy",
        "fullName email"
      );
      if (!findJob) {
        throw new ApiError(404, "Job Not Valid");
      }
      const email = (findJob.createdBy as any).email;
      const name = (findJob.createdBy as any).fullName;
      const html = removeJobTemplate
        .replace("{{username}}", name)
        .replace(
          "{{body}}",
          message ||
            "Your job post was removed because it did not comply with GigPoint community guidelines and posting policies."
        );
      const deleteJob = await Job.findByIdAndDelete(findJob._id);
      if (deleteJob) {
        const mailOptions = {
          to: email,
          subject: "Your Job Posting Has Been Removed",
          message: "Your Job Posting Has Been Removed",
          html,
        };
        const send = await sendMail(mailOptions);
        if (!send) {
          throw new ApiError(400, "Mail Sending Error");
        }
      } else {
        throw new ApiError(400, "Error In Deleting Post");
      }

      res
        .status(200)
        .json(new ApiResponse(200, findJob, "Job Has Been Removed"));
    }
  );

  dashboardData = asyncHandler(async (req: Request, res: Response) => {
    const userCheck = await User.findById(req.userId);
    if (!userCheck || !isAdmin(userCheck)) {
      throw new ApiError(403, "Permission Denied");
    }
    const totalJobs = await Job.countDocuments();
    if (totalJobs === 0) {
      throw new ApiError(404, "No Jobs Found");
    }
    const activeJobs = await Job.countDocuments({ status: "searching" });
    const ongoingJobs = await Job.countDocuments({ status: "assigned" });
    const totalTransaction = await Job.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: "$finalPrice" },
        },
      },
    ]);

    const totalUser = await User.countDocuments();
    const totalAdmin = await User.countDocuments({ role: "admin" });
    const totalCustomers = await User.countDocuments({ role: "user" });
    const totalWorker = await User.countDocuments({ role: "worker" });
    if (
      totalUser === 0 ||
      totalAdmin === 0 ||
      totalCustomers === 0 ||
      totalWorker === 0
    ) {
      throw new ApiError(404, "No Data Found");
    }

    const JobsResponse = {
      totalTransaction: totalTransaction[0].totalTransactions,
      totalJobs,
      activeJobs,
      ongoingJobs,
    };
    const UserResponse = {
      totalUser,
      totalAdmin,
      totalWorker,
      totalCustomers,
    };
    const response = {
      ...JobsResponse,
      ...UserResponse,
    };

    res
      .status(200)
      .json(new ApiResponse(200, response, "Dashboard Data Fetched"));
  });

  topWorker = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userCheck = await User.findById(req.userId);
      if (!userCheck || !isAdmin(userCheck)) {
        throw new ApiError(403, "Permission Denied");
      }

      const worker = await User.aggregate([
        { $match: { role: "worker" } }, 
        {
          $addFields: {
            jobsCount: { $size: "$jobDone" },
          },
        },
        { $sort: { jobsCount: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 1,
            fullName: 1,
            email: 1,
            jobsCount: 1,
            profilePicture: 1,
            address:1,
          },
        },
      ]);

      if (!worker || worker.length === 0) {
        throw new ApiError(404, "No Workers Found");
      }

      res
        .status(200)
        .json(new ApiResponse(200, worker, "Top Workers Data Fetched "));
    }
  );
}
export const admin = new adminController();
