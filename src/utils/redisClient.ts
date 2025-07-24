import { Redis } from "ioredis";

export const redis = new Redis();

redis.on("connect", () => {
  console.log("Redis Connection Started");
});
redis.on("error", (err) => {
  console.log("Redis Connection Failed", err);
});
