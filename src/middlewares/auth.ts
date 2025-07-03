import { NextFunction,Request,Response } from "express";
import Jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'
import { ApiError } from "../utils/ApiError";


import { User } from "../models/userModel";

declare global{
    namespace Express{
        interface Request{
            userId:string;
        }
    }
}

export const verifyUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
    const token = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1] : req.cookies?.accessToken
    
    if (!token) throw new ApiError(403, "Please Login")
    
    
        const decode = Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload
        const user = await User.findById(decode._id).select("-password -refreshToken")
        if (!user) throw new ApiError(400, "User Not Found")
        
        req.userId = user._id.toString()
        next()
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            throw new ApiError(401, "Access token expired");
        } else if (error instanceof JsonWebTokenError) {
            throw new ApiError(401, "Invalid token");
        }
    
        console.error("Auth Middleware Error:", error);
        throw new ApiError(500, "Internal server error");
    }

}