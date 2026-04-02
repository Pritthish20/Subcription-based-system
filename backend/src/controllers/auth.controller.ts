import type { Request } from "express";
import { REFRESH_TOKEN_COOKIE, clearSessionCookies, readCookie, setSessionCookies } from "../config";
import { ApiError, asyncHandler, ok } from "../lib/http";
import {
  loginUser,
  logoutUserSession,
  refreshUserSession,
  registerUser,
  requestPasswordReset,
  resetPassword
} from "../services/auth.service";
import type {
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput
} from "../validators/auth.validator";

function resolveRefreshToken(req: Request, payload: Partial<RefreshTokenInput & LogoutInput>) {
  return payload.refreshToken ?? readCookie(req, REFRESH_TOKEN_COOKIE);
}

function sessionResponse(session: Awaited<ReturnType<typeof loginUser>>) {
  return {
    user: session.user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken
  };
}

export const registerController = asyncHandler("auth.registerController", async (req, res) => {
  const session = await registerUser(req.body as RegisterInput);
  setSessionCookies(res, session.accessToken, session.refreshToken);
  ok(res, sessionResponse(session), 201);
});

export const loginController = asyncHandler("auth.loginController", async (req, res) => {
  const session = await loginUser(req.body as LoginInput);
  setSessionCookies(res, session.accessToken, session.refreshToken);
  ok(res, sessionResponse(session));
});

export const refreshController = asyncHandler("auth.refreshController", async (req, res) => {
  const refreshToken = resolveRefreshToken(req, req.body as Partial<RefreshTokenInput>);
  if (!refreshToken) {
    clearSessionCookies(res);
    throw new ApiError(401, "Refresh token required", { code: "AUTH_REFRESH_REQUIRED" });
  }

  try {
    const session = await refreshUserSession({ refreshToken });
    setSessionCookies(res, session.accessToken, session.refreshToken);
    ok(res, sessionResponse(session));
  } catch (error) {
    clearSessionCookies(res);
    throw error;
  }
});

export const logoutController = asyncHandler("auth.logoutController", async (req, res) => {
  const refreshToken = resolveRefreshToken(req, req.body as Partial<LogoutInput>);
  if (refreshToken) {
    await logoutUserSession({ refreshToken });
  }

  clearSessionCookies(res);
  ok(res, { loggedOut: true });
});

export const forgotPasswordController = asyncHandler("auth.forgotPasswordController", async (req, res) => {
  ok(res, await requestPasswordReset(req.body as ForgotPasswordInput));
});

export const resetPasswordController = asyncHandler("auth.resetPasswordController", async (req, res) => {
  const session = await resetPassword(req.body as ResetPasswordInput);
  setSessionCookies(res, session.accessToken, session.refreshToken);
  ok(res, sessionResponse(session));
});
