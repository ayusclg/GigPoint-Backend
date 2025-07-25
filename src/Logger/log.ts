
import path from "path";
import { createLogger, transports, format } from "winston";

const logdir = path.join(__dirname, "../../logs");

export const logger = createLogger({
  level: "debug",
  format: format.combine(
    format.colorize(),
      format.timestamp({ format: "HH:mm:ss" }),
    format.errors({stack:true}),
    format.printf(({ timestamp, level, stack, message }) => {
      return stack
        ? `${timestamp} ${level}:${message} - stack: ${stack}`
        : `${timestamp} ${level}:${message}`;
    })
  ),
    transports: [
        new transports.Console(),

        new transports.File({
            filename: path.join(logdir, 'error.log'),
            level: 'error',
            maxFiles: 3,
            maxsize: 5 * 1024 * 1024,
            tailable:true,
        }),
        new transports.File({
            filename: path.join(logdir, 'combined.log'),
            maxFiles: 3,
            maxsize: 10 * 1024 * 1024,
            tailable:true
        })
      
    ],
    exitOnError:false
});

