import { z } from "zod";

const proofUrlSchema = z.url().refine((value) => {
  try {
    const url = new URL(value);
    const isCloudinary = url.hostname.includes("res.cloudinary.com");
    const looksLikeImage = /\.(png|jpe?g|webp|gif|heic|heif)$/i.test(url.pathname);
    return url.protocol === "https:" && (isCloudinary || looksLikeImage);
  } catch {
    return false;
  }
}, "Use a direct HTTPS image URL or a Cloudinary proof upload URL");

export const winnerProofSchema = z.object({
  proofUrl: z.union([proofUrlSchema, z.literal("")]).optional(),
  notes: z.string().max(240).optional()
});

export const winnerReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminNotes: z.string().max(240).optional()
});

export const payoutUpdateSchema = z.object({
  paidAt: z.iso.datetime({ offset: true }).optional(),
  reference: z.string().min(2).max(120)
});

export type WinnerProofInput = z.infer<typeof winnerProofSchema>;
export type WinnerReviewInput = z.infer<typeof winnerReviewSchema>;
export type PayoutUpdateInput = z.infer<typeof payoutUpdateSchema>;
