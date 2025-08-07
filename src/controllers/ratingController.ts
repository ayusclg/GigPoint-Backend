import mongoose from "mongoose";
import { Rating } from "../models/ratingModel";
import { User } from "../models/userModel";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiRes";
import { asyncHandler } from "../utils/AsyncHandler";
import { Request, Response } from "express";
import {isWorker} from '../utils/Rolecheck'
import { logger } from "../Logger";

const createRating = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { ratedUserId, point, comment } = req.body;
    if (ratedUserId.toString() === req.userId)
      throw new ApiError(404, "You Cannot give Rating YourSelf");

    const ratedWorker = await User.findById(ratedUserId);
    if (ratedWorker && !isWorker(ratedWorker) )
      throw new ApiError(403, "You can Only Rate Workers");
    const existingRating = await Rating.findOne({
      raterUserId: req.userId,
      ratedUserId,
    });
    if (existingRating)
      throw new ApiError(403, "You Have Already Rated This Worker");
    const createdRating = await Rating.create({
      raterUserId: req.userId,
      ratedUserId,
      point: Number(point),
      comment,
    });
    if (!createdRating) throw new ApiError(400, "Rating Not Created");
    ratedWorker?.rating.push(createdRating._id as mongoose.Types.ObjectId);
    await ratedWorker?.save();
    res
      .status(201)
      .json(new ApiResponse(201, createdRating, "Worker Successfully Rated"));
  }
);

const myRating = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 5;

    const rating = await Rating.find({
      raterUserId:req.userId
    })
      .populate("raterUserId", "fullName profilePicture")
      .populate("ratedUserId", "fullName phoneNo profilePicture")
      .limit(perPage)
      .skip((page - 1) * perPage)
      .lean();
    const total = await Rating.countDocuments({
      raterUserId:req.userId
    });
    if (!rating.length) throw new ApiError(404, "No Ratings Found");
    const response = {
      totalPage: Math.ceil(total / perPage),
      total,
      page,
      perPage,
      rating,
    };
    res
      .status(200)
      .json(new ApiResponse(200, response, "Rating Fetched Successfully"));
  }
);

const deleteRating = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.body;
    const rating = await Rating.findById(id);
    if (!rating) throw new ApiError(404, "No Ratings Found");
    const isAuthorized =
      rating.raterUserId.toString() === req.userId ||
      rating.ratedUserId.toString() === req.userId;
    if (!isAuthorized) {
      throw new ApiError(403, "Permission Denied");
    }

    const userRated = await User.findById(rating.ratedUserId);
    if (!userRated) throw new ApiError(404, "ratedUser Details Not Found");

        await Rating.findByIdAndDelete(id);
        (userRated.rating as any).pull(id)
        await userRated.save()
        res.status(200).json(new ApiResponse(200,rating.comment,"Rating Deleted"))
  }
);

const showRecentRating = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.userId)
  if (!user || !isWorker(user)) throw new ApiError(403, "Permission Denied")
  
  const displayRatings = await Rating.find({ ratedUserId: user._id }).populate("raterUserId","fullName profilePicture").sort({ createdAt: "asc" }).limit(4).select("-ratedUserId").lean()
  if (!displayRatings) throw new ApiError(404, "No Ratings Found")
  
  res.status(200).json(new ApiResponse(200, displayRatings, "Ratings Fetched Successfully"))
  
  
})

const viewAllRating = asyncHandler(async (req: Request, res: Response): Promise<void> => {

  const page = parseInt(req.query.page as string) || 1
  const perPage = parseInt(req.query.perPage as string) ||5
  
  const user = await User.findById(req.userId)
  if (!user) throw new ApiError(403, "Permission Denied")
  let query:Record<string,any> ={}
  if (user.role === "user") {
    query["raterUserId"]= req.userId
  }
  else {
    query["ratedUserId"]=req.userId
  }
  logger.info(query)
  const allRatings = await Rating.find(query).populate("raterUserId","fullName profilePicture").limit(perPage).skip((page-1)*perPage).sort({createdAt:"asc"}).lean()
  if (!allRatings) throw new ApiError(404, "No Ratings Found")
  
  res.status(200).json(new ApiResponse(200,allRatings,"Ratings Fetched"))
})
export { createRating, myRating, deleteRating,showRecentRating,viewAllRating };
