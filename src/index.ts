import express from 'express'
import { Request,Response } from 'express'
import dotenv from 'dotenv'

dotenv.config()
const port = process.env.PORT || 5000
const host = '127.0.0.1'

const app = express()


app.get("/", (req:Request, res:Response):void => {
    res.send("waving from gigpoint Backend")
})

app.listen(port ,()=> {
    console.log(`your server is running on http://${host}:${port}`)
})