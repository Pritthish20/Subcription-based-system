import Razorpay from "razorpay";
import { getEnv } from "./env";

export function getRazorpay() {
  const env = getEnv();
  return env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
    : null;
}
