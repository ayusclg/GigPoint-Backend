import { Iuser } from "../models/userModel";


export const isWorker = (user: Iuser): boolean => user.role === "worker";

export const isAdmin = (user: Iuser): boolean => user.role === "admin";