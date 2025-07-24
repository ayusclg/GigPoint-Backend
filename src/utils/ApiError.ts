class ApiError extends Error{
    statusCode: number;
    success: boolean;
    stack?: string; // error and sucess response must be same implement the same as ApiRes.ts and also naming for error and sucess is not correct use APIError.ts and APISuccess.ts
    
    constructor(
        statusCode:number,
        message:string = "Something Went Wrong",
        stack = ""

    ) {
        super(message)
        this.statusCode = statusCode,
            this.success = false,
            this.name = "ApiError",
         (stack) ?  this.stack =stack : Error.captureStackTrace(this,this.constructor)
            
    }
}
export {ApiError}