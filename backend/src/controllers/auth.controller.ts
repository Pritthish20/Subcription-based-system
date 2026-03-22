import { asyncHandler, ok } from "../lib/http";
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

export const registerController = asyncHandler("auth.registerController", async (req, res) => {
  ok(res, await registerUser(req.body as RegisterInput), 201);
});

export const loginController = asyncHandler("auth.loginController", async (req, res) => {
  ok(res, await loginUser(req.body as LoginInput));
});

export const refreshController = asyncHandler("auth.refreshController", async (req, res) => {
  ok(res, await refreshUserSession(req.body as RefreshTokenInput));
});

export const logoutController = asyncHandler("auth.logoutController", async (req, res) => {
  ok(res, await logoutUserSession(req.body as LogoutInput));
});

export const forgotPasswordController = asyncHandler("auth.forgotPasswordController", async (req, res) => {
  ok(res, await requestPasswordReset(req.body as ForgotPasswordInput));
});

export const resetPasswordController = asyncHandler("auth.resetPasswordController", async (req, res) => {
  ok(res, await resetPassword(req.body as ResetPasswordInput));
});
