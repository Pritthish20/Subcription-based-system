import jwt from "jsonwebtoken";
import type { UserRole } from "../../../shared/src/index";
import { getEnv } from "./env";

export type AuthPayload = { userId: string; role: UserRole };

export function signAccessToken(payload: AuthPayload) {
  return jwt.sign(payload, getEnv().JWT_ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: AuthPayload) {
  return jwt.sign(payload, getEnv().JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, getEnv().JWT_ACCESS_SECRET) as AuthPayload;
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, getEnv().JWT_REFRESH_SECRET) as AuthPayload;
}
