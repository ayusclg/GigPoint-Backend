import { Iuser } from "../models/userModel";


export const isWorker = (user: Iuser): boolean => user.role === "worker";

