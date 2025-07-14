import  { Request, Response} from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";
import { ApiResponse } from "../utils/ApiRes";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);


 const getAI = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { question } = req.body as { question?: string };


    if (!question || typeof question !== "string") {
    throw new ApiError(404,"Only Strings Are Allowed")
    }

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [
              {
                text: `greet everytime saying namaste dont use hard confusing words in response and if i ask anything else about home service and my this project gigpoint just say sorr i cant answer anything else off topic and provide me refined answers in paragraph in easy way to read and if someone ask about gigpoint say them this is a college project developed by aayush pandey and saroj simkhada  and if i ask whats my wish say to make suresh sir happy i say you again dont go outside topic you are here only to give response of home based services like plumber carpenter electrician etc and you can solve my request as you are one of this profession and if the task needs to be done by skilled person just say you need skilled person to do this so post your requirement on gigpoint and get yourself a skilled worker on that field`,
              },
            ],
          },
          {
            role: "model",
            parts: [
              {
                text: "Understood. I will answer simply and quickly in points. I will never go outside of the topic",
              },
            ],
          },
        ],
      });

     
      const result = await chat.sendMessage(question);

     
      const response = result.response;
      const answer: string = response.text();

    
      res.status(200).json(new ApiResponse(200,answer,"Question Solved"))
    
 }
)



export {getAI}