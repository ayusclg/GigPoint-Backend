import mongoose from "mongoose";

export interface PriceRange {
    initial: number;
    final: number;
  }
  
export interface Ijob extends mongoose.Document{
    title: string;
    description: string;
    image: string,
    priceRange: PriceRange;
    priority: "low" | "medium" | "high";
    createdBy: mongoose.Types.ObjectId;
    status: "searching" | "assigned" | "completed";

}

const priceRangeSchema = new mongoose.Schema<PriceRange>({
    initial: { type: Number, required: true },
    final: { type: Number, required: true },
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
    status: {
        type: String,
        enum:["searching","assigned","completed"]
    }
}, {
    timestamps:true,
})


export const Job = mongoose.model<Ijob>("Job",jobSchema)