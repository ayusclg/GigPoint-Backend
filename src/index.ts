import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { Request, Response } from 'express'
import authRoutes from './routes/userRoutes'

const port = process.env.PORT || 5000
const host = '127.0.0.1'

const app = express()

//test
app.get("/", (req:Request, res:Response):void => {
    res.send("<h1>waving from gigpoint Backend</h1>")
})

//middlewares

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use()

//routes
app.use("/api/v1/auth",authRoutes)


app.listen(port ,()=> {
    console.log(`your server is running on http://${host}:${port}`)
})