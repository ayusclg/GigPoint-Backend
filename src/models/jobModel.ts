import mongoose from "mongoose";
import { createSchemaWithCommon, ICommon } from './commonModel';


export interface PriceRange {
    initial: number;
    end: number;
}
  

enum category{
    Plumber="plumber",
    Electrician="electrician",
    Cleaner="cleaner",
    Saloon="saloon",
    Carpentry="carpentry",
    Driver="driver",
    HomeRenovation="homeRenovation",

}
  
export interface Ijob extends mongoose.Document{
    title: string;
    description: string;
    image: string,
    priceRange: PriceRange;
    priority: "low" | "medium" | "high";
    createdBy: mongoose.Types.ObjectId;
    status: "searching" | "assigned" | "completed";
    applications: mongoose.Types.ObjectId[];
    assignedTo: mongoose.Types.ObjectId;
    category:category;
    finalPrice: number;
    address: string;
    createdAt?: Date;
    updatedAt?: Date;
    deadline: Date;
}

const priceRangeSchema = new mongoose.Schema<PriceRange>({
    initial: { type: Number, required: true },
    end: { type: Number, required: true },
},
{ _id: false });
  
const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required:true
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type:String,
    },
    priceRange: {
        type: priceRangeSchema,
        required:true,
    },
    priority: {
        type: String,
        enum: ["low", "high", "medium"],
        required:true,
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required:true,
    },
    finalPrice: {
        type:Number,
    },
    status: {
        type: String,
        enum: ["searching", "assigned", "completed"],
        default:"searching"
    },
    assignedTo: {
        type: mongoose.Types.ObjectId,
        ref:"User"
    },
    applications: [{
        type: mongoose.Types.ObjectId,
        ref:"Application"
    }],
    category: {
        type: String,
        enum:Object.values(category)
    },
    address: {
        type: String,
        required:true,
    },
    deadline: {
        type: Date,
        required:true,
    }
}, {
    timestamps:true,
})


export const Job = mongoose.model<Ijob>("Job",jobSchema)