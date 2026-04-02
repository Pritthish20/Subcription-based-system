import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  charityFindById: vi.fn(),
  userFindOne: vi.fn(),
  userCreate: vi.fn(),
  userFindById: vi.fn(),
  notify: vi.fn(),
  signAccessToken: vi.fn(() => "access-token"),
  signRefreshToken: vi.fn(() => "refresh-token"),
  verifyRefreshToken: vi.fn(() => ({ userId: "user-1", role: "subscriber" }))
}));

vi.mock("../src/models", () => ({
  Charity: { findById: mocks.charityFindById },
  User: { findOne: mocks.userFindOne, create: mocks.userCreate, findById: mocks.userFindById }
}));

vi.mock("../src/config", () => ({
  signAccessToken: mocks.signAccessToken,
  signRefreshToken: mocks.signRefreshToken,
  verifyRefreshToken: mocks.verifyRefreshToken
}));

vi.mock("../src/services/notification.service", () => ({
  notify: mocks.notify
}));

import { loginUser, refreshUserSession, requestPasswordReset, resetPassword } from "../src/services/auth.service";

describe("auth service flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signAccessToken.mockReturnValue("access-token");
    mocks.signRefreshToken.mockReturnValue("refresh-token");
    mocks.verifyRefreshToken.mockReturnValue({ userId: "user-1", role: "subscriber" });
  });

  it("issues a rotated session on login", async () => {
    const save = vi.fn();
    const bcrypt = (await import("bcryptjs")).default;
    mocks.userFindOne.mockResolvedValue({
      _id: { toString: () => "user-1" },
      role: "subscriber",
      passwordHash: await bcrypt.hash("Password@123", 1),
      save
    });

    const result = await loginUser({ email: "Player@example.com", password: "Password@123" });

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(save).toHaveBeenCalledOnce();
    expect(mocks.userFindOne).toHaveBeenCalledWith({ email: "player@example.com" });
  });

  it("refreshes a session when the refresh token matches the stored hash", async () => {
    const save = vi.fn();
    const { createHash } = await import("crypto");
    mocks.userFindById.mockResolvedValue({
      _id: { toString: () => "user-1" },
      role: "subscriber",
      refreshTokenHash: createHash("sha256").update("refresh-token").digest("hex"),
      save
    });

    const result = await refreshUserSession({ refreshToken: "refresh-token" });

    expect(mocks.verifyRefreshToken).toHaveBeenCalledWith("refresh-token");
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(save).toHaveBeenCalledOnce();
  });

  it("creates a reset token for delivery and completes the password reset flow without exposing it in the response", async () => {
    const requestSave = vi.fn();
    mocks.userFindOne.mockResolvedValueOnce({
      _id: { toString: () => "user-1" },
      email: "player@example.com",
      save: requestSave
    });

    const resetRequest = await requestPasswordReset({ email: "player@example.com" });

    expect(resetRequest).toEqual({ message: "If an account exists for this email, reset instructions have been generated." });
    expect(mocks.notify).toHaveBeenCalledWith("user-1", "auth.password_reset_requested", expect.objectContaining({ resetToken: expect.any(String) }));
    const resetToken = mocks.notify.mock.calls[0]?.[2]?.resetToken;
    expect(resetToken).toBeTruthy();

    const resetSave = vi.fn();
    mocks.userFindOne.mockResolvedValueOnce({
      _id: { toString: () => "user-1" },
      role: "subscriber",
      email: "player@example.com",
      save: resetSave
    });

    const result = await resetPassword({ token: resetToken, password: "NewPassword@123" });

    expect(result.accessToken).toBe("access-token");
    expect(resetSave).toHaveBeenCalledTimes(2);
    expect(mocks.notify).toHaveBeenLastCalledWith("user-1", "auth.password_reset_completed", { email: "player@example.com" });
  });
});
