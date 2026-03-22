import mongoose from "mongoose";
import { getEnv } from "./env";

const globalCache = globalThis as typeof globalThis & { mongooseConnection?: Promise<typeof mongoose> };

export async function connectDb() {
  const env = getEnv();

  if (!globalCache.mongooseConnection) {
    globalCache.mongooseConnection = mongoose.connect(env.MONGODB_URI);
  }

  return globalCache.mongooseConnection;
}
