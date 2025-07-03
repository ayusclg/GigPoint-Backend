class ApiError extends Error{
    statusCode: number;
    success: boolean;
    stack?: string;
    
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