import type { Request, RequestHandler } from "express";
import type { UserRole } from "../../../shared/src/index";
import { verifyAccessToken } from "../config";
import { ApiError } from "../lib/http";
import { User } from "../models";

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new ApiError(401, "Authentication required");

    const payload = verifyAccessToken(header.slice(7));
    const user = await User.findById(payload.userId);
    if (!user) throw new ApiError(401, "User not found");

    req.auth = payload;
    req.currentUser = user;
    next();
  } catch (error) {
    next(error);
  }
};

export function authorize(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth || !req.currentUser) {
      next(new ApiError(401, "Authentication required"));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(new ApiError(403, "Forbidden"));
      return;
    }

    next();
  };
}

export function getAuthContext(req: Request) {
  if (!req.auth || !req.currentUser) {
    throw new ApiError(401, "Authentication required");
  }

  return { payload: req.auth, user: req.currentUser };
}