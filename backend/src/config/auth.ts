import jwt from "jsonwebtoken";
import type { CookieOptions, Request, Response } from "express";
import type { UserRole } from "../../../shared/src/index";
import { getEnv } from "./env";

export type AuthPayload = { userId: string; role: UserRole };

export const ACCESS_TOKEN_COOKIE = "golf_access_token";
export const REFRESH_TOKEN_COOKIE = "golf_refresh_token";
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

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

function isSecureCookie() {
  try {
    return new URL(getEnv().APP_URL).protocol === "https:";
  } catch {
    return false;
  }
}

function sessionCookieOptions(maxAge: number): CookieOptions {
  const secure = isSecureCookie();
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge
  };
}

export function setSessionCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, sessionCookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, sessionCookieOptions(REFRESH_TOKEN_MAX_AGE_MS));
}

export function clearSessionCookies(res: Response) {
  const accessOptions = sessionCookieOptions(ACCESS_TOKEN_MAX_AGE_MS);
  const refreshOptions = sessionCookieOptions(REFRESH_TOKEN_MAX_AGE_MS);
  res.clearCookie(ACCESS_TOKEN_COOKIE, { httpOnly: accessOptions.httpOnly, secure: accessOptions.secure, sameSite: accessOptions.sameSite, path: accessOptions.path });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { httpOnly: refreshOptions.httpOnly, secure: refreshOptions.secure, sameSite: refreshOptions.sameSite, path: refreshOptions.path });
}

export function readCookie(req: Request, name: string) {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    if (key !== name) continue;
    return decodeURIComponent(trimmed.slice(separatorIndex + 1));
  }

  return undefined;
}
