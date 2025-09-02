import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors, { CorsOptionsDelegate, CorsRequest } from "cors";
import morgan from "morgan";
import passport from "passport";

import authRoutes from "./routes/userRoutes";
import jobRoutes from "./routes/jobRoutes";
import ratingRoutes from "./routes/ratingRoutes";
import googleRoutes from "./routes/gooleRoutes";
import aiRoutes from "./routes/aiRoute";
import adminRoutes from './routes/adminRoutes'
import { swaggerDocs } from "./config/swagger";
import { dbConnect } from "./database";
import { logger } from "./Logger";
import "./config/Passport";
import "./utils/redisClient";

class Server {
  private app: Express;
  private port: number;
  private host: string;

  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.host = "0.0.0.0";

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
    this.connectDatabaseAndStart();
  }

  private initializeMiddlewares(): void {
    const allowedOrigins = ["http://localhost:5173"];
    const corsOptions: CorsOptionsDelegate = async (
      req: CorsRequest,
      callback
    ) => {
      const origin = req.headers.origin;
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, { credentials: true, origin: true });
      } else {
        callback(new Error("Not Allowed By Cors"), { origin: false });
      }
    };

    this.app.use(cors(corsOptions));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(
      morgan("combined", {
        stream: {
          write: (message) => logger.http(message.trim()),
        },
      })
    );
    passport.initialize();

    this.app.get("/", (req: Request, res: Response) => {
      res.send("<h1>This is a dockerized backend, Enjoyyy!</h1>");
    });
  }

  private initializeRoutes(): void {
    this.app.use("/api/v1/auth", authRoutes);
    this.app.use("/api/v1/job", jobRoutes);
    this.app.use("/api/v1/rating", ratingRoutes);
    this.app.use("/api/v1/oauth", googleRoutes);
    this.app.use("/ai", aiRoutes);
    this.app.use("/admin",adminRoutes)
  }

  private initializeSwagger(): void {
    swaggerDocs(this.app as Express, this.port);
  }

  private initializeErrorHandling(): void {
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

  private async connectDatabaseAndStart(): Promise<void> {
    try {
      await dbConnect();
      this.app.listen(this.port, this.host, () => {
        logger.info(`Server running on http://${this.host}:${this.port}`);
      });
    } catch (err: any) {
      logger.error("Error in DB Connection", err.message);
      process.exit(1);
    }
  }
}

new Server(Number(process.env.PORT) || 5000);
