import crypto from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  planFindById: vi.fn(),
  userFindById: vi.fn(),
  charityFindById: vi.fn(),
  subscriptionFindOneAndUpdate: vi.fn(),
  subscriptionFindOne: vi.fn(),
  transactionCreate: vi.fn(),
  transactionFindOne: vi.fn(),
  donationCreate: vi.fn(),
  donationFindOne: vi.fn(),
  webhookFindOne: vi.fn(),
  webhookCreate: vi.fn(),
  notify: vi.fn(),
  getRazorpay: vi.fn(() => null),
  getEnv: vi.fn(() => ({ APP_URL: "http://localhost:5173", APP_ENV: "development" }))
}));

vi.mock("../src/models", () => ({
  Plan: { findById: mocks.planFindById },
  User: { findById: mocks.userFindById },
  Charity: { findById: mocks.charityFindById },
  Subscription: { findOneAndUpdate: mocks.subscriptionFindOneAndUpdate, findOne: mocks.subscriptionFindOne },
  SubscriptionTransaction: { create: mocks.transactionCreate, findOne: mocks.transactionFindOne },
  DonationAllocation: { create: mocks.donationCreate, findOne: mocks.donationFindOne },
  WebhookEvent: { findOne: mocks.webhookFindOne, create: mocks.webhookCreate }
}));

vi.mock("../src/config", () => ({
  getRazorpay: mocks.getRazorpay,
  getEnv: mocks.getEnv,
  isProductionEnv: (env = mocks.getEnv()) => env.APP_ENV === "production"
}));

vi.mock("../src/services/notification.service", () => ({
  notify: mocks.notify
}));

import {
  cancelSubscription,
  handleCheckout,
  handleDonationVerification,
  handleOneTimeDonation,
  handleSubscriptionVerification,
  handleWebhook
} from "../src/services/billing.service";

describe("billing service flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRazorpay.mockReturnValue(null);
    mocks.getEnv.mockReturnValue({ APP_URL: "http://localhost:5173", APP_ENV: "development" });
    mocks.subscriptionFindOneAndUpdate.mockResolvedValue({ _id: "subscription-1" });
    mocks.transactionFindOne.mockResolvedValue(null);
    mocks.donationFindOne.mockResolvedValue(null);
    mocks.transactionCreate.mockResolvedValue({ _id: "transaction-1" });
    mocks.donationCreate.mockResolvedValue({ _id: "donation-1" });
  });

  it("rejects subscription checkout when Razorpay is absent", async () => {
    mocks.planFindById.mockResolvedValue({ _id: "plan-1", name: "Monthly", interval: "monthly", amountInr: 1000, providerPlanId: "", prizePoolContributionPercentage: 40 });
    mocks.userFindById.mockResolvedValue({ _id: "user-1", selectedCharityId: "charity-1", charityPercentage: 20, accountState: "pending", save: vi.fn() });

    await expect(handleCheckout("user-1", { planId: "plan-1", successUrl: "http://app/success", cancelUrl: "http://app/cancel" })).rejects.toMatchObject({
      statusCode: 503,
      code: "PAYMENT_PROVIDER_UNAVAILABLE"
    });
    expect(mocks.subscriptionFindOneAndUpdate).not.toHaveBeenCalled();
    expect(mocks.transactionCreate).not.toHaveBeenCalled();
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("rejects one-time donation when Razorpay is absent", async () => {
    mocks.userFindById.mockResolvedValue({ _id: "user-1", email: "demo@example.com", fullName: "Demo User" });
    mocks.charityFindById.mockResolvedValue({ _id: "charity-1", name: "Helping Hands" });

    await expect(handleOneTimeDonation("user-1", { charityId: "charity-1", amount: 500, message: "Keep going", successUrl: "http://app/dashboard", cancelUrl: "http://app/dashboard" })).rejects.toMatchObject({
      statusCode: 503,
      code: "PAYMENT_PROVIDER_UNAVAILABLE"
    });
    expect(mocks.donationCreate).not.toHaveBeenCalled();
  });

  it("creates a Razorpay order for subscription checkout in non-production when recurring plan ids are unavailable", async () => {
    const orderCreate = vi.fn().mockResolvedValue({ id: "order_sub_123", amount: 100000, currency: "INR" });
    mocks.getEnv.mockReturnValue({ APP_URL: "http://localhost:5173", APP_ENV: "development", RAZORPAY_KEY_ID: "rzp_test_123", RAZORPAY_KEY_SECRET: "secret" });
    mocks.getRazorpay.mockReturnValue({ orders: { create: orderCreate }, subscriptions: { create: vi.fn() } });
    mocks.planFindById.mockResolvedValue({ _id: "plan-1", name: "Monthly", interval: "monthly", amountInr: 1000, providerPlanId: "", prizePoolContributionPercentage: 40 });
    mocks.userFindById.mockResolvedValue({ _id: "user-1", email: "demo@example.com", fullName: "Demo User" });

    const result = await handleCheckout("user-1", { planId: "plan-1", successUrl: "http://app/success", cancelUrl: "http://app/cancel" });

    expect(result).toMatchObject({
      mode: "razorpay",
      checkout: {
        kind: "subscription-order",
        orderId: "order_sub_123",
        amount: 100000,
        currency: "INR"
      }
    });
    expect(orderCreate).toHaveBeenCalledWith(expect.objectContaining({
      amount: 100000,
      currency: "INR",
      notes: expect.objectContaining({ checkoutKind: "subscription-order", userId: "user-1", planId: "plan-1" })
    }));
  });

  it("rejects subscription checkout in production when the seeded Razorpay plan id is missing", async () => {
    mocks.getEnv.mockReturnValue({ APP_URL: "http://localhost:5173", APP_ENV: "production", RAZORPAY_KEY_ID: "rzp_live_123", RAZORPAY_KEY_SECRET: "secret" });
    mocks.getRazorpay.mockReturnValue({ subscriptions: { create: vi.fn() }, orders: { create: vi.fn() } });
    mocks.planFindById.mockResolvedValue({ _id: "plan-1", name: "Monthly", interval: "monthly", amountInr: 1000, providerPlanId: "", prizePoolContributionPercentage: 40 });
    mocks.userFindById.mockResolvedValue({ _id: "user-1", email: "demo@example.com", fullName: "Demo User" });

    await expect(handleCheckout("user-1", { planId: "plan-1", successUrl: "http://app/success", cancelUrl: "http://app/cancel" })).rejects.toMatchObject({
      statusCode: 503,
      code: "PAYMENT_PROVIDER_PLAN_UNAVAILABLE",
      message: expect.stringContaining("RAZORPAY_MONTHLY_PLAN_ID"),
      context: expect.objectContaining({
        interval: "monthly",
        seededEnvKey: "RAZORPAY_MONTHLY_PLAN_ID"
      })
    });
  });

  it("verifies a non-production order-based subscription payment and activates the subscription", async () => {
    const save = vi.fn();
    mocks.getEnv.mockReturnValue({ APP_URL: "http://localhost:5173", APP_ENV: "development", RAZORPAY_KEY_SECRET: "secret" });
    mocks.getRazorpay.mockReturnValue({
      orders: {
        fetch: vi.fn().mockResolvedValue({ id: "order_sub_123", notes: { checkoutKind: "subscription-order", userId: "user-1", planId: "plan-1", interval: "monthly" } })
      },
      payments: {
        fetch: vi.fn().mockResolvedValue({ id: "pay_123", order_id: "order_sub_123", status: "captured" })
      }
    });
    mocks.planFindById.mockResolvedValue({ _id: "plan-1", name: "Monthly", interval: "monthly", amountInr: 1000 });
    mocks.userFindById.mockResolvedValue({ _id: "user-1", selectedCharityId: "charity-1", charityPercentage: 20, accountState: "pending", save });

    const signature = crypto.createHmac("sha256", "secret").update("order_sub_123|pay_123").digest("hex");
    const result = await handleSubscriptionVerification("user-1", {
      checkoutKind: "order",
      planId: "plan-1",
      orderId: "order_sub_123",
      paymentId: "pay_123",
      signature
    });

    expect(result).toMatchObject({ verified: true, mode: "razorpay", message: expect.stringContaining("test mode") });
    expect(mocks.subscriptionFindOneAndUpdate).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }), expect.objectContaining({ status: "active", paymentProvider: "razorpay" }), expect.any(Object));
    expect(mocks.transactionCreate).toHaveBeenCalledWith(expect.objectContaining({ eventType: "subscription.activated", providerReference: "pay_123", status: "active" }));
    expect(mocks.donationCreate).toHaveBeenCalledWith(expect.objectContaining({ type: "subscription", userId: "user-1", status: "completed", providerReference: "pay_123" }));
    expect(save).toHaveBeenCalledOnce();
  });

  it("creates a Razorpay donation checkout order when the provider is configured", async () => {
    const orderCreate = vi.fn().mockResolvedValue({ id: "order_123", amount: 50000, currency: "INR" });
    mocks.getEnv.mockReturnValue({ APP_URL: "http://localhost:5173", APP_ENV: "development", RAZORPAY_KEY_ID: "rzp_test_123", RAZORPAY_KEY_SECRET: "secret" });
    mocks.getRazorpay.mockReturnValue({ orders: { create: orderCreate } });
    mocks.userFindById.mockResolvedValue({ _id: "user-1", email: "demo@example.com", fullName: "Demo User" });
    mocks.charityFindById.mockResolvedValue({ _id: "charity-1", name: "Helping Hands" });

    const result = await handleOneTimeDonation("user-1", { charityId: "charity-1", amount: 500, message: "Keep going", successUrl: "http://app/dashboard", cancelUrl: "http://app/dashboard" });

    expect(result.mode).toBe("razorpay");
    expect(result.checkout?.orderId).toBe("order_123");
    expect(orderCreate).toHaveBeenCalledWith(expect.objectContaining({ amount: 50000, currency: "INR" }));
  });

  it("verifies a Razorpay donation payment and records the donation ledger", async () => {
    mocks.getEnv.mockReturnValue({ APP_URL: "http://localhost:5173", APP_ENV: "development", RAZORPAY_KEY_SECRET: "secret" });
    mocks.getRazorpay.mockReturnValue({
      orders: {
        fetch: vi.fn().mockResolvedValue({ id: "order_123", notes: { userId: "user-1", charityId: "charity-1", amountInr: "750", message: "For the cause" } })
      },
      payments: {
        fetch: vi.fn().mockResolvedValue({ id: "pay_123", order_id: "order_123", status: "captured" })
      }
    });
    mocks.userFindById.mockResolvedValue({ _id: "user-1", email: "demo@example.com", fullName: "Demo User" });
    mocks.charityFindById.mockResolvedValue({ _id: "charity-1", name: "Helping Hands" });

    const signature = crypto.createHmac("sha256", "secret").update("order_123|pay_123").digest("hex");
    const result = await handleDonationVerification("user-1", { orderId: "order_123", paymentId: "pay_123", signature });

    expect(result).toMatchObject({ verified: true, mode: "razorpay" });
    expect(mocks.donationCreate).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1", charityId: "charity-1", amountInr: 750, source: "razorpay", providerReference: "pay_123", status: "completed" }));
  });

  it("cancels an active subscription and records the cancellation transaction", async () => {
    const save = vi.fn();
    mocks.subscriptionFindOne.mockResolvedValue({ _id: "subscription-1", planId: "plan-1", status: "active", paymentProvider: "razorpay", save });

    const result = await cancelSubscription("user-1", { reason: "Need a break" });

    expect(result.status).toBe("cancelled");
    expect(result.cancellationReason).toBe("Need a break");
    expect(save).toHaveBeenCalledOnce();
    expect(mocks.transactionCreate).toHaveBeenCalledWith(expect.objectContaining({ eventType: "subscription.cancelled", status: "cancelled" }));
  });

  it("rejects webhook handling when the webhook secret is absent", async () => {
    mocks.getEnv.mockReturnValue({ APP_URL: "http://localhost:5173", APP_ENV: "development" });

    await expect(handleWebhook(Buffer.from("{}"), "signature", "evt_123")).rejects.toMatchObject({
      statusCode: 503,
      code: "PAYMENT_WEBHOOK_UNAVAILABLE"
    });
    expect(mocks.webhookFindOne).not.toHaveBeenCalled();
  });

  it("skips duplicate processed Razorpay webhook events", async () => {
    const event = {
      event: "subscription.activated",
      created_at: 1_711_010_101,
      payload: {
        subscription: {
          entity: {
            id: "sub_123",
            status: "active",
            notes: { userId: "user-1", planId: "plan-1" }
          }
        }
      }
    };

    mocks.getEnv.mockReturnValue({ APP_URL: "http://localhost:5173", APP_ENV: "development", RAZORPAY_WEBHOOK_SECRET: "whsec_test" });
    mocks.webhookFindOne.mockResolvedValue({ status: "processed" });

    const raw = JSON.stringify(event);
    const signature = crypto.createHmac("sha256", "whsec_test").update(raw).digest("hex");
    const result = await handleWebhook(Buffer.from(raw), signature, "evt_123");

    expect(result).toMatchObject({ received: true, type: "subscription.activated", duplicate: true });
    expect(mocks.planFindById).not.toHaveBeenCalled();
    expect(mocks.webhookCreate).not.toHaveBeenCalled();
  });
});
