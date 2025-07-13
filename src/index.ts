import dotenv from 'dotenv'
dotenv.config()

import express, { NextFunction } from 'express'
import { Request, Response } from 'express'
import authRoutes from './routes/userRoutes'
import { dbConnect } from './database'
import cookieParser from 'cookie-parser'
import jobRoutes from './routes/jobRoutes'
import ratingRoutes from './routes/ratingRoutes'
import passport from 'passport'
import googleRoutes from './routes/gooleRoutes'
import { swaggerDocs } from './config/swagger'
import aiRoutes from './routes/aiRoute'

const port = process.env.PORT || 5000
const host = '127.0.0.1'

const app = express()

//test
app.get("/", (req:Request, res:Response):void => {
    res.send("<h1>waving from gigpoint Backend</h1>")
})


 
//middlewares
passport.initialize()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

//routes
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/job", jobRoutes)
app.use("/api/v1/rating",ratingRoutes)
app.use("/api/v1/oauth", googleRoutes)
app.use("/ai",aiRoutes)

//documentation
swaggerDocs(app, Number(port));

dbConnect().then(() => {
    app.listen(port ,()=> {
        console.log(`your server is running on http://${host}:${port}`)
    })
})
    .catch((err: any) => console.log("Error In Db Connection", err.message))

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500).json({
        message: err.message,
        stack: err.stack,
        data:null,
        ...err
    })
    
    })