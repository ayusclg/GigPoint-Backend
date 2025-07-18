import { NextFunction,Request,Response } from "express";

export const asyncHandler = ((func: (req: Request, res: Response, next: NextFunction)=>Promise<any>) => {
    return(req: Request, res: Response, next: NextFunction)=> {
        Promise.resolve(func(req,res,next)).catch((err)=>next(err))
    }
})
