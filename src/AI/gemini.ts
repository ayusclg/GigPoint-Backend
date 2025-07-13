import  { Request, Response} from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);


 const getAI = async (req: Request, res: Response): Promise<void> => {
    const { question } = req.body as { question?: string };


    if (!question || typeof question !== "string") {
      res
        .status(400)
        .json({ error: "Question is required and must be a string" });
      return;
    }

    try {
    
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
                text: "Understood. I will answer simply and quickly in points.",
              },
            ],
          },
        ],
      });

     
      const result = await chat.sendMessage(question);

     
      const response = result.response;
      const answer: string = response.text();

    
      res.status(200).json({ answer });
    } catch (error: any) {
      console.error("Gemini Error:", error.message || error);
      res.status(500).json({ error: "AI request failed" });
    }
  }



export {getAI}