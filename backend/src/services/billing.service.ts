import crypto from "crypto";
import Razorpay from "razorpay";
import {
  CHARITY_MIN_PERCENTAGE,
  type CancelSubscriptionInput,
  type CheckoutInput,
  type OneTimeDonationInput,
  type SubscriptionStatus,
  type VerifyDonationPaymentInput,
  type VerifySubscriptionPaymentInput
} from "../../../shared/src/index";
import { getEnv, getRazorpay } from "../config";
import { ApiError, runService } from "../lib/http";
import { Charity, DonationAllocation, Plan, Subscription, SubscriptionTransaction, User, WebhookEvent } from "../models";
import { notify } from "./notification.service";

const CHECKOUT_THEME_COLOR = "#1D7A63";
const PLATFORM_NAME = "Digital Heroes Golf Charity";

type ProviderSource = "razorpay" | "manual";
type RazorpayEventPayload = {
  event: string;
  created_at?: number;
  payload?: {
    payment?: { entity?: Record<string, any> };
    subscription?: { entity?: Record<string, any> };
    order?: { entity?: Record<string, any> };
  };
};

type ProviderErrorLike = {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    field?: string;
    source?: string;
    step?: string;
    metadata?: Record<string, unknown>;
  };
  statusCode?: number;
  code?: string;
  description?: string;
  message?: string;
};

function unixToDate(value?: number | string | null) {
  if (!value) return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  return new Date(numeric * 1000);
}

function buildFallbackPeriod(interval: string) {
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + (interval === "yearly" ? 12 : 1));
  return { start, end };
}

function mapRazorpaySubscriptionStatus(status?: string): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "halted":
      return "past_due";
    case "cancelled":
      return "cancelled";
    case "completed":
    case "expired":
      return "lapsed";
    case "authenticated":
    case "pending":
    case "created":
    default:
      return "incomplete";
  }
}

function verifyRazorpaySignature(payload: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function toProviderApiError(error: unknown, fallbackMessage: string, fallbackCode: string) {
  if (error instanceof ApiError) return error;

  const providerError = error as ProviderErrorLike | undefined;
  const details = providerError?.error;
  const message = details?.description || providerError?.description || providerError?.message || fallbackMessage;

  return new ApiError(providerError?.statusCode ?? 502, message, {
    code: details?.code || providerError?.code || fallbackCode,
    context: {
      reason: details?.reason,
      field: details?.field,
      source: details?.source,
      step: details?.step,
      metadata: details?.metadata
    },
    cause: error
  });
}

async function getUserAndCharity(userId: string, charityId?: string) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found", { code: "USER_NOT_FOUND" });

  const charity = charityId ? await Charity.findById(charityId) : null;
  if (charityId && !charity) throw new ApiError(404, "Charity not found", { code: "CHARITY_NOT_FOUND" });

  return { user, charity };
}

async function ensureRazorpayPlan(plan: any, razorpay: Razorpay) {
  const env = getEnv();
  if (plan.providerPlanId) return plan.providerPlanId as string;

  const seededPlanId = plan.interval === "monthly" ? env.RAZORPAY_MONTHLY_PLAN_ID : env.RAZORPAY_YEARLY_PLAN_ID;
  if (seededPlanId) {
    plan.providerPlanId = seededPlanId;
    plan.paymentProvider = "razorpay";
    if (typeof plan.save === "function") await plan.save();
    return seededPlanId;
  }

  let created: any;
  try {
    created = await razorpay.plans.create({
      period: plan.interval,
      interval: 1,
      item: {
        name: plan.name,
        amount: Math.round(plan.amountInr * 100),
        currency: "INR",
        description: `${plan.name} membership`
      },
      notes: {
        localPlanId: plan._id.toString(),
        interval: plan.interval
      }
    });
  } catch (error) {
    throw toProviderApiError(error, "Failed to create Razorpay plan", "RAZORPAY_PLAN_CREATE_FAILED");
  }

  plan.providerPlanId = created.id;
  plan.paymentProvider = "razorpay";
  if (typeof plan.save === "function") await plan.save();

  return created.id;
}

async function createIndependentDonationRecord(
  userId: string,
  payload: Pick<OneTimeDonationInput, "charityId" | "amount" | "message">,
  source: ProviderSource,
  providerReference?: string
) {
  const { charity } = await getUserAndCharity(userId, payload.charityId);

  if (providerReference) {
    const existing = await DonationAllocation.findOne({ providerReference, type: "independent" });
    if (existing) return existing;
  }

  const donation = await DonationAllocation.create({
    userId,
    charityId: payload.charityId,
    type: "independent",
    amountInr: payload.amount,
    message: payload.message,
    source,
    providerReference,
    status: "completed"
  });

  await notify(userId, "donation.created", {
    amountInr: payload.amount,
    charityName: charity?.name,
    message: payload.message,
    providerReference
  });

  return donation;
}

async function activateSubscription({
  userId,
  plan,
  providerReference,
  source,
  status = "active",
  providerCustomerId,
  providerSubscriptionId,
  currentPeriodStart,
  currentPeriodEnd
}: {
  userId: string;
  plan: any;
  providerReference: string;
  source: ProviderSource;
  status?: SubscriptionStatus;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found", { code: "USER_NOT_FOUND" });

  const fallbackPeriod = buildFallbackPeriod(plan.interval);
  const start = currentPeriodStart ?? fallbackPeriod.start;
  const end = currentPeriodEnd ?? fallbackPeriod.end;

  const subscription = await Subscription.findOneAndUpdate(
    { userId },
    {
      userId,
      planId: plan._id,
      status,
      paymentProvider: source,
      providerCustomerId: providerCustomerId ?? undefined,
      providerSubscriptionId: providerSubscriptionId ?? undefined,
      currentPeriodStart: start,
      currentPeriodEnd: end
    },
    { upsert: true, new: true }
  );

  if (status === "active") {
    user.accountState = "active";
    await user.save();
  }

  let transaction = providerReference
    ? await SubscriptionTransaction.findOne({ providerReference, eventType: "subscription.activated" })
    : null;

  if (!transaction) {
    transaction = await SubscriptionTransaction.create({
      userId,
      subscriptionId: subscription._id,
      planId: plan._id,
      source,
      eventType: "subscription.activated",
      amountInr: plan.amountInr,
      currency: "INR",
      providerReference,
      status
    });
  }

  const existingAllocation = providerReference
    ? await DonationAllocation.findOne({ providerReference, type: "subscription" })
    : null;

  if (!existingAllocation) {
    await DonationAllocation.create({
      userId,
      charityId: user.selectedCharityId,
      subscriptionTransactionId: transaction._id,
      type: "subscription",
      amountInr: plan.amountInr * ((user.charityPercentage ?? CHARITY_MIN_PERCENTAGE) / 100),
      percentage: user.charityPercentage ?? CHARITY_MIN_PERCENTAGE,
      source,
      providerReference,
      status: "completed"
    });

    await notify(userId, "subscription.activated", {
      planId: plan._id.toString(),
      planName: plan.name,
      status
    });
  }

  return subscription;
}

function webhookSummary(event: RazorpayEventPayload) {
  const payment = event.payload?.payment?.entity;
  const subscription = event.payload?.subscription?.entity;
  const order = event.payload?.order?.entity;

  return {
    paymentId: typeof payment?.id === "string" ? payment.id : undefined,
    subscriptionId: typeof subscription?.id === "string" ? subscription.id : typeof payment?.subscription_id === "string" ? payment.subscription_id : undefined,
    orderId: typeof order?.id === "string" ? order.id : typeof payment?.order_id === "string" ? payment.order_id : undefined,
    notes: subscription?.notes ?? order?.notes ?? payment?.notes,
    createdAt: event.created_at
  };
}

async function reserveWebhook(eventId: string, event: RazorpayEventPayload) {
  const existing = await WebhookEvent.findOne({ provider: "razorpay", eventId });
  if (existing?.status === "processed") {
    return { duplicate: true, record: existing } as const;
  }

  let record = existing;
  if (!record) {
    try {
      record = await WebhookEvent.create({
        provider: "razorpay",
        eventId,
        type: event.event,
        status: "pending",
        attemptCount: 1,
        receivedAt: new Date(),
        payloadSummary: webhookSummary(event)
      });
    } catch {
      const duplicate = await WebhookEvent.findOne({ provider: "razorpay", eventId });
      if (duplicate?.status === "processed") {
        return { duplicate: true, record: duplicate } as const;
      }
      if (!duplicate) throw new ApiError(500, "Failed to reserve webhook", { code: "WEBHOOK_RESERVATION_FAILED" });
      record = duplicate;
    }
  }

  if (record.status !== "processed") {
    record.type = event.event;
    record.status = "pending";
    record.attemptCount = (record.attemptCount ?? 0) + (existing ? 1 : 0);
    record.receivedAt = new Date();
    record.payloadSummary = webhookSummary(event);
    record.lastError = undefined;
    await record.save();
  }

  return { duplicate: false, record } as const;
}

function getWebhookEventId(event: RazorpayEventPayload, eventHeader?: string | string[]) {
  const headerValue = Array.isArray(eventHeader) ? eventHeader[0] : eventHeader;
  if (headerValue) return headerValue;

  const summary = webhookSummary(event);
  return [event.event, summary.paymentId ?? summary.subscriptionId ?? summary.orderId ?? "unknown", event.created_at ?? Date.now()].join(":");
}

async function fetchVerifiedSubscription(razorpay: Razorpay, payload: VerifySubscriptionPaymentInput) {
  const secret = getEnv().RAZORPAY_KEY_SECRET;
  if (!secret) throw new ApiError(503, "Razorpay is not configured", { code: "PAYMENT_PROVIDER_UNAVAILABLE" });

  const expectedPayload = `${payload.paymentId}|${payload.subscriptionId}`;
  if (!verifyRazorpaySignature(expectedPayload, payload.signature, secret)) {
    throw new ApiError(400, "Subscription payment verification failed", { code: "PAYMENT_SIGNATURE_INVALID" });
  }

  return razorpay.subscriptions.fetch(payload.subscriptionId) as Promise<any>;
}

async function fetchVerifiedDonation(razorpay: Razorpay, payload: VerifyDonationPaymentInput) {
  const secret = getEnv().RAZORPAY_KEY_SECRET;
  if (!secret) throw new ApiError(503, "Razorpay is not configured", { code: "PAYMENT_PROVIDER_UNAVAILABLE" });

  const expectedPayload = `${payload.orderId}|${payload.paymentId}`;
  if (!verifyRazorpaySignature(expectedPayload, payload.signature, secret)) {
    throw new ApiError(400, "Donation payment verification failed", { code: "PAYMENT_SIGNATURE_INVALID" });
  }

  const [order, payment] = await Promise.all([
    razorpay.orders.fetch(payload.orderId) as Promise<any>,
    razorpay.payments.fetch(payload.paymentId) as Promise<any>
  ]);

  return { order, payment };
}

export async function listPlans() {
  return runService("billing.service", "listPlans", async () => Plan.find().sort({ amountInr: 1 }));
}

export async function handleCheckout(userId: string, payload: CheckoutInput) {
  return runService("billing.service", "handleCheckout", async () => {
    const plan = await Plan.findById(payload.planId);
    if (!plan) throw new ApiError(404, "Plan not found", { code: "PLAN_NOT_FOUND" });

    const { user } = await getUserAndCharity(userId);
    const razorpay = getRazorpay();
    const env = getEnv();

    if (!razorpay || !env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      await activateSubscription({ userId, plan, providerReference: `manual-${Date.now()}`, source: "manual" });
      return {
        mode: "mock" as const,
        paymentProvider: "manual" as const,
        checkoutUrl: payload.successUrl,
        message: "Razorpay is not configured, so the subscription was activated in zero-cost demo mode."
      };
    }

    const providerPlanId = await ensureRazorpayPlan(plan, razorpay);
    let remoteSubscription: any;
    try {
      remoteSubscription = await razorpay.subscriptions.create({
        plan_id: providerPlanId,
        total_count: plan.interval === "yearly" ? 10 : 120,
        quantity: 1,
        customer_notify: 1,
        notes: {
          checkoutKind: "subscription",
          userId,
          planId: plan._id.toString()
        }
      }) as any;
    } catch (error) {
      throw toProviderApiError(error, "Failed to create Razorpay subscription", "RAZORPAY_SUBSCRIPTION_CREATE_FAILED");
    }

    await Subscription.findOneAndUpdate(
      { userId },
      {
        userId,
        planId: plan._id,
        status: "incomplete",
        paymentProvider: "razorpay",
        providerSubscriptionId: remoteSubscription.id
      },
      { upsert: true, new: true }
    );

    return {
      mode: "razorpay" as const,
      paymentProvider: "razorpay" as const,
      message: "Continue in Razorpay Checkout to activate your subscription.",
      checkout: {
        kind: "subscription" as const,
        key: env.RAZORPAY_KEY_ID,
        subscriptionId: remoteSubscription.id,
        name: PLATFORM_NAME,
        description: `${plan.name} membership`,
        prefill: {
          name: user.fullName,
          email: user.email
        },
        notes: {
          userId,
          planId: plan._id.toString()
        },
        theme: { color: CHECKOUT_THEME_COLOR },
        successUrl: payload.successUrl,
        cancelUrl: payload.cancelUrl
      }
    };
  });
}

export async function handleSubscriptionVerification(userId: string, payload: VerifySubscriptionPaymentInput) {
  return runService("billing.service", "handleSubscriptionVerification", async () => {
    const razorpay = getRazorpay();
    if (!razorpay) throw new ApiError(503, "Razorpay is not configured", { code: "PAYMENT_PROVIDER_UNAVAILABLE" });

    const plan = await Plan.findById(payload.planId);
    if (!plan) throw new ApiError(404, "Plan not found", { code: "PLAN_NOT_FOUND" });

    const remoteSubscription = await fetchVerifiedSubscription(razorpay, payload);
    if (remoteSubscription.notes?.userId !== userId || remoteSubscription.notes?.planId !== payload.planId) {
      throw new ApiError(403, "Subscription does not belong to this user", { code: "PAYMENT_FORBIDDEN" });
    }

    const subscription = await activateSubscription({
      userId,
      plan,
      providerReference: payload.subscriptionId,
      source: "razorpay",
      status: mapRazorpaySubscriptionStatus(remoteSubscription.status),
      providerCustomerId: remoteSubscription.customer_id ?? undefined,
      providerSubscriptionId: payload.subscriptionId,
      currentPeriodStart: unixToDate(remoteSubscription.current_start),
      currentPeriodEnd: unixToDate(remoteSubscription.current_end)
    });

    return {
      verified: true,
      mode: "razorpay" as const,
      subscription,
      message: "Subscription activated successfully.",
      redirectUrl: `${getEnv().APP_URL}/dashboard`
    };
  });
}

export async function handleOneTimeDonation(userId: string, payload: OneTimeDonationInput) {
  return runService("billing.service", "handleOneTimeDonation", async () => {
    const env = getEnv();
    const razorpay = getRazorpay();
    const successUrl = payload.successUrl ?? `${env.APP_URL}/dashboard`;
    const cancelUrl = payload.cancelUrl ?? `${env.APP_URL}/dashboard`;

    const { user, charity } = await getUserAndCharity(userId, payload.charityId);

    if (!razorpay || !env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      const donation = await createIndependentDonationRecord(userId, payload, "manual", `manual-donation-${Date.now()}`);
      return {
        mode: "mock" as const,
        paymentProvider: "manual" as const,
        checkoutUrl: successUrl,
        message: "Razorpay is not configured, so the donation was recorded directly in demo mode.",
        donation
      };
    }

    let order: any;
    try {
      order = await razorpay.orders.create({
        amount: Math.round(payload.amount * 100),
        currency: "INR",
        receipt: `donation_${Date.now()}`,
        notes: {
          checkoutKind: "donation",
          userId,
          charityId: payload.charityId,
          amountInr: String(payload.amount),
          message: payload.message ?? ""
        }
      }) as any;
    } catch (error) {
      throw toProviderApiError(error, "Failed to create Razorpay donation order", "RAZORPAY_ORDER_CREATE_FAILED");
    }

    return {
      mode: "razorpay" as const,
      paymentProvider: "razorpay" as const,
      message: "Continue in Razorpay Checkout to complete your donation.",
      checkout: {
        kind: "donation" as const,
        key: env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        name: PLATFORM_NAME,
        description: `Donation to ${charity?.name ?? "selected charity"}`,
        prefill: {
          name: user.fullName,
          email: user.email
        },
        notes: {
          charityId: payload.charityId,
          amountInr: String(payload.amount)
        },
        theme: { color: CHECKOUT_THEME_COLOR },
        successUrl,
        cancelUrl
      }
    };
  });
}

export async function handleDonationVerification(userId: string, payload: VerifyDonationPaymentInput) {
  return runService("billing.service", "handleDonationVerification", async () => {
    const razorpay = getRazorpay();
    if (!razorpay) throw new ApiError(503, "Razorpay is not configured", { code: "PAYMENT_PROVIDER_UNAVAILABLE" });

    const { order, payment } = await fetchVerifiedDonation(razorpay, payload);
    if (payment.order_id !== payload.orderId) {
      throw new ApiError(400, "Donation payment verification failed", { code: "PAYMENT_ORDER_MISMATCH" });
    }

    if (order.notes?.userId !== userId) {
      throw new ApiError(403, "Donation does not belong to this user", { code: "PAYMENT_FORBIDDEN" });
    }

    if (!["captured", "authorized"].includes(payment.status)) {
      throw new ApiError(400, "Donation payment has not completed", { code: "PAYMENT_NOT_COMPLETED" });
    }

    const donation = await createIndependentDonationRecord(
      userId,
      {
        charityId: order.notes?.charityId,
        amount: Number(order.notes?.amountInr ?? 0),
        message: order.notes?.message || undefined
      },
      "razorpay",
      payload.paymentId
    );

    return {
      verified: true,
      mode: "razorpay" as const,
      donation,
      message: "Donation completed successfully.",
      redirectUrl: `${getEnv().APP_URL}/dashboard`
    };
  });
}

export async function cancelSubscription(userId: string, payload: CancelSubscriptionInput) {
  return runService("billing.service", "cancelSubscription", async () => {
    const subscription = await Subscription.findOne({ userId });
    if (!subscription) throw new ApiError(404, "Subscription not found", { code: "SUBSCRIPTION_NOT_FOUND" });

    const razorpay = getRazorpay();
    if (subscription.paymentProvider === "razorpay" && subscription.providerSubscriptionId && razorpay) {
      await razorpay.subscriptions.cancel(subscription.providerSubscriptionId, false);
    }

    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = payload.reason;
    await subscription.save();

    await SubscriptionTransaction.create({
      userId,
      subscriptionId: subscription._id,
      planId: subscription.planId,
      source: subscription.paymentProvider ?? "manual",
      eventType: "subscription.cancelled",
      amountInr: 0,
      currency: "INR",
      providerReference: subscription.providerSubscriptionId,
      status: "cancelled"
    });

    return subscription;
  });
}

export async function handleWebhook(body: unknown, signatureHeader?: string | string[], eventIdHeader?: string | string[]) {
  return runService("billing.service", "handleWebhook", async () => {
    const env = getEnv();
    if (!env.RAZORPAY_WEBHOOK_SECRET) return { received: true, mode: "mock" as const };

    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!signature) throw new ApiError(400, "Missing Razorpay signature", { code: "RAZORPAY_SIGNATURE_MISSING" });

    const payloadString = Buffer.isBuffer(body) ? body.toString("utf8") : typeof body === "string" ? body : JSON.stringify(body);
    if (!verifyRazorpaySignature(payloadString, signature, env.RAZORPAY_WEBHOOK_SECRET)) {
      throw new ApiError(400, "Invalid Razorpay webhook signature", { code: "RAZORPAY_SIGNATURE_INVALID" });
    }

    const event = JSON.parse(payloadString) as RazorpayEventPayload;
    const reservation = await reserveWebhook(getWebhookEventId(event, eventIdHeader), event);
    if (reservation.duplicate) {
      return { received: true, type: event.event, duplicate: true };
    }

    try {
      if (["subscription.activated", "subscription.charged"].includes(event.event)) {
        const remoteSubscription = event.payload?.subscription?.entity;
        const userId = remoteSubscription?.notes?.userId;
        const planId = remoteSubscription?.notes?.planId;
        const plan = planId ? await Plan.findById(planId) : null;

        if (userId && plan) {
          await activateSubscription({
            userId,
            plan,
            providerReference: remoteSubscription.id,
            source: "razorpay",
            status: mapRazorpaySubscriptionStatus(remoteSubscription.status),
            providerCustomerId: remoteSubscription.customer_id ?? undefined,
            providerSubscriptionId: remoteSubscription.id,
            currentPeriodStart: unixToDate(remoteSubscription.current_start),
            currentPeriodEnd: unixToDate(remoteSubscription.current_end)
          });
        }
      }

      if (event.event === "payment.captured") {
        const payment = event.payload?.payment?.entity;
        if (payment?.order_id && !payment?.subscription_id) {
          const razorpay = getRazorpay();
          if (razorpay) {
            const order = await razorpay.orders.fetch(payment.order_id) as any;
            if (order?.notes?.checkoutKind === "donation" && order.notes?.userId && order.notes?.charityId) {
              await createIndependentDonationRecord(
                order.notes.userId,
                {
                  charityId: order.notes.charityId,
                  amount: Number(order.notes.amountInr ?? 0),
                  message: order.notes.message || undefined
                },
                "razorpay",
                payment.id
              );
            }
          }
        }
      }

      if (["subscription.cancelled", "subscription.halted", "subscription.completed", "subscription.expired"].includes(event.event)) {
        const remoteSubscription = event.payload?.subscription?.entity;
        if (remoteSubscription?.id) {
          await Subscription.findOneAndUpdate(
            { providerSubscriptionId: remoteSubscription.id },
            {
              status: mapRazorpaySubscriptionStatus(remoteSubscription.status),
              cancelledAt: new Date()
            }
          );
        }
      }

      reservation.record.status = "processed";
      reservation.record.processedAt = new Date();
      reservation.record.lastError = undefined;
      await reservation.record.save();

      return { received: true, type: event.event };
    } catch (error) {
      reservation.record.status = "failed";
      reservation.record.lastError = (error as Error).message;
      await reservation.record.save();
      throw error;
    }
  });
}


