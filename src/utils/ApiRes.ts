class ApiResponse {
    statusCode: number;
    message: string;
    data:any;
    success:boolean

    constructor(
        statusCode: number,
        data :any,
        message: string = "Execution Successfully Done",
    )
    {
        this.message = message,
           this.statusCode = statusCode,
            this.data = data
        this.success = (statusCode)<400
            
    }
}