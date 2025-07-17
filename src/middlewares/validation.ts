import { NextFunction, Request, Response } from "express";
import Joi from "joi";

const registerWorker = Joi.object({
  fullName: Joi.string().min(4).max(30).required(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
      )
    )
    .message(
      "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character"
    )
    .required(),
  address: Joi.string().required(),
  phoneNo: Joi.string().required(),
  experienceYear: Joi.number().required().min(1),
  skills: Joi.array().items(Joi.string()).unique().required(),
  gender: Joi.string().valid("male", "female", "others").required(),
    role: Joi.string().valid("worker").required(),
  profilePicture:Joi.string().required()
});

export const validateRegisterWorker = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await registerWorker.validateAsync(req.body);
    next();
  } catch (error: any) {
    res.status(400).json({
      message:
        error.details[0].message || " Validation Error In Worker Register",
    });
  }
};

const jobPost = Joi.object({
  title: Joi.string().min(5).max(50).required(),
  description: Joi.string().min(5).max(100).required(),
  priceRange: Joi.object({
    initial: Joi.number().min(0).required().label("initialPrice"),
    final: Joi.number()
      .required()
      .min(Joi.ref("initialPrice"))
      .label("finalPrice"),
  }),
    skills: Joi.array().items(Joi.string()).unique().required(),
    priority: Joi.string().valid("low", "medium", "high").required(),
    createdBy: Joi.string().hex().length(24).required(),
    image:Joi.string()
});

export const validateJobPost = async (req:Request,res:Response,next:NextFunction) => {
    try {
        await jobPost.validateAsync(req.body)
        next()
    } catch (error:any) {
        res.status(400).json({
            message:error.details[0].message || "Validation Error In Creating Post"
        })
    }
}