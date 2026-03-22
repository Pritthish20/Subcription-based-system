import { z } from "zod";
import { CHARITY_MIN_PERCENTAGE } from "../../../shared/src/index";

export const adminUserUpdateSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.email(),
  role: z.enum(["subscriber", "admin"]),
  accountState: z.enum(["pending", "active", "inactive"]),
  selectedCharityId: z.string().min(1),
  charityPercentage: z.number().min(CHARITY_MIN_PERCENTAGE).max(100)
});

export const adminSubscriptionUpdateSchema = z.object({
  status: z.enum(["incomplete", "active", "past_due", "cancelled", "lapsed"]),
  currentPeriodEnd: z.union([z.iso.datetime({ offset: true }), z.literal("")]).optional(),
  cancellationReason: z.string().max(240).optional()
});

export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type AdminSubscriptionUpdateInput = z.infer<typeof adminSubscriptionUpdateSchema>;