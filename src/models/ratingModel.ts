import mongoose from "mongoose";

export interface Irating extends mongoose.Document{
    raterId: mongoose.Types.ObjectId;
    ratedUserId: mongoose.Types.ObjectId;
    point: number;
    comment: string;
}

const ratingSchema = new mongoose.Schema({
    raterId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required:true,
    },
    point: {
        type: Number,
        required: true,
        min: 1,
        max:5,
        
    },
    comment: {
        type: String,
        trim:true,
    },
    ratedUserId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required:true,
    }

}, {
    timestamps:true
})

export const Rating = mongoose.model<Irating>("Rating",ratingSchema)