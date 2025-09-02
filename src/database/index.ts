import mongoose from "mongoose";
import { logger } from "../Logger";

class Database {
  public async connect(): Promise<void> {
    try {
      const mongoInstance = await mongoose.connect(
        process.env.MONGODB_URI as string
      );
      logger.info(
        "MongoDB Connected Successfully on:",
        mongoInstance.connection.host
      );
    } catch (error) {
      logger.error("Error in MongoDB", error);
      process.exit(1);
    }
  }
}

export const dbConnect = new Database().connect.bind(new Database());
