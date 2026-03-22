import { z } from "zod";

export const checkoutSchema = z.object({
  planId: z.string().min(1),
  successUrl: z.url(),
  cancelUrl: z.url()
});

export const verifySubscriptionPaymentSchema = z.object({
  planId: z.string().min(1),
  subscriptionId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1)
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().max(240).optional()
});

export const oneTimeDonationSchema = z.object({
  charityId: z.string().min(1),
  amount: z.number().positive(),
  message: z.string().max(240).optional(),
  successUrl: z.url().optional(),
  cancelUrl: z.url().optional()
});

export const verifyDonationPaymentSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1)
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type VerifySubscriptionPaymentInput = z.infer<typeof verifySubscriptionPaymentSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type OneTimeDonationInput = z.infer<typeof oneTimeDonationSchema>;
export type VerifyDonationPaymentInput = z.infer<typeof verifyDonationPaymentSchema>;
