import { getAuthContext } from "../middlewares";
import { asyncHandler, ok } from "../lib/http";
import {
  cancelSubscription,
  handleCheckout,
  handleDonationVerification,
  handleSubscriptionVerification,
  handleWebhook,
  listPlans
} from "../services/billing.service";
import type {
  CancelSubscriptionInput,
  CheckoutInput,
  VerifyDonationPaymentInput,
  VerifySubscriptionPaymentInput
} from "../validators/billing.validator";

export const listPlansController = asyncHandler("billing.listPlansController", async (_req, res) => {
  ok(res, await listPlans());
});

export const checkoutController = asyncHandler("billing.checkoutController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await handleCheckout(user._id.toString(), req.body as CheckoutInput));
});

export const verifySubscriptionController = asyncHandler("billing.verifySubscriptionController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await handleSubscriptionVerification(user._id.toString(), req.body as VerifySubscriptionPaymentInput));
});

export const verifyDonationController = asyncHandler("billing.verifyDonationController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await handleDonationVerification(user._id.toString(), req.body as VerifyDonationPaymentInput));
});

export const cancelSubscriptionController = asyncHandler("billing.cancelSubscriptionController", async (req, res) => {
  const { user } = getAuthContext(req);
  ok(res, await cancelSubscription(user._id.toString(), req.body as CancelSubscriptionInput));
});

export const webhookController = asyncHandler("billing.webhookController", async (req, res) => {
  ok(res, await handleWebhook(req.body, req.headers["x-razorpay-signature"], req.headers["x-razorpay-event-id"]));
});
