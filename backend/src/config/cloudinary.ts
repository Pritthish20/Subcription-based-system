import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "./env";
import { ApiError } from "../lib/http";

export function configureCloudinary() {
  const env = getEnv();
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET
    });
  }
}

export function ensureCloudinaryReady() {
  const env = getEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ApiError(503, "Cloudinary is not configured for uploads");
  }
  return env;
}

export { cloudinary };
