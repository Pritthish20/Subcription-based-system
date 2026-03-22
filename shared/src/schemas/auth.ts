import { z } from "zod";
import { CHARITY_MIN_PERCENTAGE } from "../constants/domain";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters long")
});

export const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.email(),
  password: z.string().min(8).max(128),
  selectedCharityId: z.string().min(1, "Please select a charity"),
  charityPercentage: z.number().min(CHARITY_MIN_PERCENTAGE).max(100)
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
  charityPercentage: z.number().min(CHARITY_MIN_PERCENTAGE).max(100),
  selectedCharityId: z.string().min(1)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(16)
});

export const logoutSchema = refreshTokenSchema;

export const forgotPasswordSchema = z.object({
  email: z.email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(128)
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
