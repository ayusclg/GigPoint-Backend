import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors, { CorsOptionsDelegate, CorsRequest } from "cors";
import morgan from "morgan";
import passport from "passport";

import authRoutes from "./routes/userRoutes";
import jobRoutes from "./routes/jobRoutes";
import ratingRoutes from "./routes/ratingRoutes";
import googleRoutes from "./routes/gooleRoutes";
import aiRoutes from "./routes/aiRoute";
import { dbConnect } from "./database";
import { swaggerDocs } from "./config/swagger";
import { logger } from "./Logger";
import "./config/Passport";
import "./utils/redisClient";

class Server {
  public app: express.Application;
  private port: number;
  private host: string = "127.0.0.1";

  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.middlewares();
    this.routes();
    this.errorHandler();
    this.connectDB();
  }

  private middlewares(): void {
    const allowedOrigin = ["http://localhost:5173"];
    const corsOptions: CorsOptionsDelegate = async (
      req: CorsRequest,
      callback
    ) => {
      const origin = req.headers.origin;
      if (!origin || allowedOrigin.includes(origin))
        return callback(null, { credentials: true, origin: true });
      else callback(new Error("Not Allowed By Cors"), { origin: false });
    };

    this.app.use(cors(corsOptions));
    passport.initialize();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(
      morgan("combined", {
        stream: { write: (msg) => logger.http(msg.trim()) },
      })
    );

    this.app.get("/", (req: Request, res: Response) => {
      res.send("<h1>This is a dockerized backend , Enjoyyy!</h1>");
    });
  }

  private routes(): void {
    this.app.use("/api/v1/auth", authRoutes);
    this.app.use("/api/v1/job", jobRoutes);
    this.app.use("/api/v1/rating", ratingRoutes);
    this.app.use("/api/v1/oauth", googleRoutes);
    this.app.use("/ai", aiRoutes);
  }

  private errorHandler(): void {
    this.app.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        res.status(err.status || 500).json({
          message: err.message,
          stack: err.stack,
          data: null,
          ...err,
        });
      }
    );
  }

  private async connectDB(): Promise<void> {
    try {
      await dbConnect();
      this.app.listen(this.port, () => {
        logger.info(`Server running on http://${this.host}:${this.port}`);
      });
    } catch (error: any) {
      logger.error("Error in DB Connection", error.message);
    }
  }
}

new Server(Number(process.env.PORT) || 5000);
