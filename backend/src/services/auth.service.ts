import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import type {
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput
} from "../../../shared/src/index";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../config";
import { ApiError, runService } from "../lib/http";
import { Charity, User } from "../models";
import type { UserDoc } from "../models";
import { notify } from "./notification.service";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function issueSession(user: UserDoc & { _id: { toString(): string }; save: () => Promise<unknown> }) {
  const accessToken = signAccessToken({ userId: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  return { user, accessToken, refreshToken };
}

export async function registerUser(payload: RegisterInput) {
  return runService("auth.service", "registerUser", async () => {
    if (await User.findOne({ email: payload.email.toLowerCase() })) {
      throw new ApiError(409, "Email already registered", { code: "AUTH_EMAIL_EXISTS" });
    }

    const charity = await Charity.findById(payload.selectedCharityId);
    if (!charity) {
      throw new ApiError(404, "Selected charity not found", { code: "CHARITY_NOT_FOUND" });
    }

    const user = await User.create({
      ...payload,
      email: payload.email.toLowerCase(),
      passwordHash: await bcrypt.hash(payload.password, 12),
      accountState: "pending"
    });

    await notify(user._id.toString(), "auth.registered", { email: user.email });
    return issueSession(user);
  });
}

export async function loginUser(payload: LoginInput) {
  return runService("auth.service", "loginUser", async () => {
    const user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user || !(await bcrypt.compare(payload.password, user.passwordHash))) {
      throw new ApiError(401, "Invalid email or password", { code: "AUTH_INVALID_CREDENTIALS" });
    }

    return issueSession(user);
  });
}

export async function refreshUserSession(payload: RefreshTokenInput) {
  return runService("auth.service", "refreshUserSession", async () => {
    let tokenPayload;
    try {
      tokenPayload = verifyRefreshToken(payload.refreshToken);
    } catch {
      throw new ApiError(401, "Invalid refresh token", { code: "AUTH_REFRESH_INVALID" });
    }

    const user = await User.findById(tokenPayload.userId);
    if (!user || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(payload.refreshToken)) {
      throw new ApiError(401, "Refresh session not found", { code: "AUTH_REFRESH_NOT_FOUND" });
    }

    return issueSession(user);
  });
}

export async function logoutUserSession(payload: LogoutInput) {
  return runService("auth.service", "logoutUserSession", async () => {
    try {
      const tokenPayload = verifyRefreshToken(payload.refreshToken);
      await User.findByIdAndUpdate(tokenPayload.userId, { $unset: { refreshTokenHash: 1 } });
    } catch {
      return { loggedOut: true };
    }

    return { loggedOut: true };
  });
}

export async function requestPasswordReset(payload: ForgotPasswordInput) {
  return runService("auth.service", "requestPasswordReset", async () => {
    const user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      return { message: "If an account exists for this email, reset instructions have been generated." };
    }

    const token = randomBytes(24).toString("hex");
    user.resetPasswordTokenHash = hashToken(token);
    user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60_000);
    await user.save();

    await notify(user._id.toString(), "auth.password_reset_requested", {
      email: user.email,
      resetToken: token,
      expiresAt: user.resetPasswordExpiresAt.toISOString()
    });

    return {
      message: "Reset instructions generated. In this demo build, the reset token is returned directly.",
      debugResetToken: token
    };
  });
}

export async function resetPassword(payload: ResetPasswordInput) {
  return runService("auth.service", "resetPassword", async () => {
    const user = await User.findOne({
      resetPasswordTokenHash: hashToken(payload.token),
      resetPasswordExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      throw new ApiError(400, "Reset token is invalid or expired", { code: "AUTH_RESET_INVALID" });
    }

    user.passwordHash = await bcrypt.hash(payload.password, 12);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    user.refreshTokenHash = undefined;
    await user.save();

    await notify(user._id.toString(), "auth.password_reset_completed", { email: user.email });
    return issueSession(user);
  });
}


