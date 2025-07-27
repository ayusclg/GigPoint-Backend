import mongoose from "mongoose";
import { logger } from "../Logger";

export const dbConnect = async () => {
  try {
    const mongoInstace = await mongoose.connect(
      process.env.MONGODB_URI as string
    );
    logger.info(
      "MongoDb Connected Successfully on:",
      mongoInstace.connection.host
    );
  } catch (error) {
    logger.error("Error In MONGODB", error);
    process.exit(1);
  }
};
