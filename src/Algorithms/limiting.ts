import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import { Job } from "../models/jobModel";

export const limitJobPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentPostsCount = await Job.countDocuments({
      createdBy: userId,
      createdAt: { $gt: last24h },
    });

    if (recentPostsCount >= 5) {
      res
        .status(429)
        .json({ message: "You can only post 5 jobs in 24 hours." });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const limitJobApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentApplicationsCount = await User.aggregate([
      { $match: { _id: userId } },
      {
        $project: {
          recentApplications: {
            $filter: {
              input: "$jobApplied",
              as: "app",
              cond: { $gt: ["$$app.createdAt", last24h] },
            },
          },
        },
      },
      { $project: { count: { $size: "$recentApplications" } } },
    ]);

    if (recentApplicationsCount[0]?.count >= 10) {
      res
        .status(429)
        .json({ message: "You can only apply to 10 jobs in 24 hours." });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
