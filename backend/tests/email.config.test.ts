import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEnv: vi.fn()
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn()
  }
}));

vi.mock("../src/config/env", () => ({
  getEnv: mocks.getEnv,
  isProductionEnv: (env?: { APP_ENV?: string }) => (env ?? mocks.getEnv()).APP_ENV === "production"
}));

import { sendEmail } from "../src/config/email";

describe("email config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEnv.mockReturnValue({
      APP_ENV: "development",
      EMAIL_PROVIDER: "mock",
      EMAIL_FROM: "no-reply@test.dev"
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows mock email delivery outside production", async () => {
    const result = await sendEmail({
      to: "player@example.com",
      subject: "Test",
      text: "Hello",
      html: "<p>Hello</p>"
    });

    expect(result.provider).toBe("mock");
    expect(result.messageId).toMatch(/^mock-/);
  });

  it("rejects mock email delivery in production", async () => {
    mocks.getEnv.mockReturnValue({
      APP_ENV: "production",
      EMAIL_PROVIDER: "mock",
      EMAIL_FROM: "no-reply@test.dev"
    });

    await expect(sendEmail({
      to: "player@example.com",
      subject: "Test",
      text: "Hello",
      html: "<p>Hello</p>"
    })).rejects.toThrow("Mock email delivery is not allowed in production");
  });
});
