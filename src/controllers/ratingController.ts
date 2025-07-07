import mongoose from "mongoose";
import { Irating, Rating } from "../models/ratingModel";
import { User } from "../models/userModel";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiRes";
import { asyncHandler } from "../utils/AsyncHandler";
import { Request,Response } from "express";

const createRating = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { ratedUserId,point,comment } = req.body
    if (ratedUserId.toString() === req.userId) throw new ApiError(404, "You Cannot give Rating YourSelf")
    
    const ratedWorker = await User.findById(ratedUserId)
    if (ratedWorker && ratedWorker.role !== "worker") throw new ApiError(403, "You can Only Rate Workers")
    
    const createdRating = await Rating.create({
        raterId: req.userId,
        ratedUserId,
        point: Number(point),
        comment,
    })
    if (!createRating) throw new ApiError(400, "Rating Not Created")
    ratedWorker?.rating.push(createdRating._id as mongoose.Types.ObjectId)
    await ratedWorker?.save()
    res.status(201).json(new ApiResponse(201,createdRating,"Worker Successfully Rated"))
})

export {createRating}