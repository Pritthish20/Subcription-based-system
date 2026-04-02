import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEnv: vi.fn(),
  charityCountDocuments: vi.fn(),
  charityInsertMany: vi.fn(),
  charityFind: vi.fn(),
  planCountDocuments: vi.fn(),
  planInsertMany: vi.fn(),
  userFindOne: vi.fn(),
  userCreate: vi.fn(),
  bcryptHash: vi.fn()
}));

vi.mock("bcryptjs", () => ({
  default: { hash: mocks.bcryptHash }
}));

vi.mock("../src/config", () => ({
  getEnv: mocks.getEnv
}));

vi.mock("../src/models", () => ({
  Charity: {
    countDocuments: mocks.charityCountDocuments,
    insertMany: mocks.charityInsertMany,
    find: mocks.charityFind
  },
  Plan: {
    countDocuments: mocks.planCountDocuments,
    insertMany: mocks.planInsertMany
  },
  User: {
    findOne: mocks.userFindOne,
    create: mocks.userCreate
  }
}));

import { ensureSeedData } from "../src/services/seed.service";

function baseEnv() {
  return {
    APP_ENV: "development" as const,
    MONGODB_URI: "mongodb://127.0.0.1:27017/test",
    JWT_ACCESS_SECRET: "test-access-secret",
    JWT_REFRESH_SECRET: "test-refresh-secret",
    EMAIL_PROVIDER: "mock" as const,
    EMAIL_FROM: "no-reply@test.dev",
    APP_URL: "https://frontend.golf.test",
    ADDITIONAL_ALLOWED_ORIGINS: "",
    RAZORPAY_MONTHLY_PLAN_ID: undefined,
    RAZORPAY_YEARLY_PLAN_ID: undefined,
    RAZORPAY_KEY_ID: undefined,
    RAZORPAY_KEY_SECRET: undefined,
    RAZORPAY_WEBHOOK_SECRET: undefined,
    CLOUDINARY_CLOUD_NAME: undefined,
    CLOUDINARY_API_KEY: undefined,
    CLOUDINARY_API_SECRET: undefined,
    SMTP_HOST: undefined,
    SMTP_PORT: undefined,
    SMTP_SECURE: undefined,
    SMTP_USER: undefined,
    SMTP_PASS: undefined,
    SEED_ADMIN_EMAIL: undefined,
    SEED_ADMIN_PASSWORD: undefined
  };
}

function charityFindResult(charities: unknown[]) {
  return { sort: vi.fn().mockResolvedValue(charities) };
}

describe("seed service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getEnv.mockReturnValue(baseEnv());
    mocks.charityCountDocuments.mockResolvedValue(0);
    mocks.charityInsertMany.mockResolvedValue(undefined);
    mocks.charityFind.mockReturnValue(charityFindResult([{ _id: "charity-1" }]));
    mocks.userFindOne.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValue(undefined);
    mocks.bcryptHash.mockResolvedValue("hashed-password");
  });

  it("uses the built-in demo admin credentials in demo mode", async () => {
    mocks.getEnv.mockReturnValue({
      ...baseEnv(),
      APP_ENV: "demo"
    });

    await ensureSeedData();

    expect(mocks.bcryptHash).toHaveBeenCalledWith("Admin@123456", 12);
    expect(mocks.userCreate).toHaveBeenCalledWith(expect.objectContaining({
      email: "admin@digitalheroes.demo",
      role: "admin",
      selectedCharityId: "charity-1"
    }));
  });

  it("rejects non-demo seeding when explicit admin credentials are missing", async () => {
    await expect(ensureSeedData()).rejects.toMatchObject({
      statusCode: 400,
      code: "SEED_ADMIN_CREDENTIALS_REQUIRED"
    });

    expect(mocks.userCreate).not.toHaveBeenCalled();
  });

  it("uses explicit admin credentials outside demo mode", async () => {
    mocks.getEnv.mockReturnValue({
      ...baseEnv(),
      APP_ENV: "production",
      SEED_ADMIN_EMAIL: "owner@example.com",
      SEED_ADMIN_PASSWORD: "Sup3rSecure!234"
    });

    await ensureSeedData();

    expect(mocks.bcryptHash).toHaveBeenCalledWith("Sup3rSecure!234", 12);
    expect(mocks.userCreate).toHaveBeenCalledWith(expect.objectContaining({
      email: "owner@example.com",
      role: "admin",
      selectedCharityId: "charity-1"
    }));
  });
});
