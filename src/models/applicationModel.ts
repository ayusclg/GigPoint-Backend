import mongoose from 'mongoose'

export interface Iapply extends mongoose.Document{
    jobId: mongoose.Types.ObjectId,
    appliedAt: Date;
    appliedBy: mongoose.Types.ObjectId,
    status:"pending" | "accepted" |"rejected"

}

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Types.ObjectId,
        ref:"Job",
        required:true,
    },
    appliedAt: {
        type: Date,
        default:Date.now()  
    },
    appliedBy: [{
        type: mongoose.Types.ObjectId,
        ref: "User",
        required:true,
    }],
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default:"pending",
    },
    message: {
        type: String,
        required:true
    },
})

export const Application = mongoose.model<Iapply>("Application",applicationSchema)