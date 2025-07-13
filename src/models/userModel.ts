import mongoose, { Mongoose } from "mongoose";
import jwt from 'jsonwebtoken'

export interface Iuser extends Document{
    googleId: string;
    fullName: string,
    email: string,
    password?: string;
    profilePicture?: string;
    phoneNo: string;
    address?: string;
    skills: string[];
    experienceYear: number,
    workDone: mongoose.Types.ObjectId[];
    gender: "male" | "female" | "other";
    role: "user" | "worker" | "admin";
    generateRefreshToken(): string;
    generateAccessToken(): string;
    jobPosted: mongoose.Types.ObjectId[];
    jobApplied: mongoose.Types.ObjectId[]
    rating: mongoose.Types.ObjectId[];
    isAvailable: boolean;
}


const userSchema = new mongoose.Schema({
    googleId: {
        type:String
    },
    fullName: {
        type: String,
        required:true
    },
    email: {
        type: String,
        required: true,
        unique:true,
    },
    password: {
        type: String,
        
    },
    profilePicture: {
        type: String,
        required:true,
    },
    role: {
        type: String,
        enum: ["user", "worker", "admin"],
        required:true
    },
    phoneNo: {
        type: String,
        unique: true,
          match: /^[0-9]{10}$/
    },
    address: {
        type: String,
    },
    skills: [{
        type: String,
    }],
    experienceYear: {
        type:Number,
    },
    jobDone: [{
        type: mongoose.Types.ObjectId,
        ref:"Job"
    }],
    jobPosted:[ {
        type: mongoose.Types.ObjectId,
        ref:"Job"
    }],
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        required:true,
    },
    refreshToken: {
        type: String,
    },
    jobApplied:[ {
        type: mongoose.Types.ObjectId,
        ref:"Application"
    }],
    rating: [{
        type: mongoose.Types.ObjectId,
        ref:"Rating"
    }],
   isAvailable: {
       type: Boolean,
       default:true
   }
},
    {
    timestamps:true,
    }
)

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
        
    }, process.env.REFRESH_TOKEN_SECRET as string,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY as any
        }
    )
}
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        fullName: this.fullName,
        gender:this.gender
        
    }, process.env.ACCESS_TOKEN_SECRET as string,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY as any
        }
    )
}

export const User = mongoose.model<Iuser>("User",userSchema)