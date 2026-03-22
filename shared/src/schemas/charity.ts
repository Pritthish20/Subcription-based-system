import { z } from "zod";

export const charityEventSchema = z.object({
  title: z.string().min(2).max(120),
  startsAt: z.iso.datetime({ offset: true }),
  location: z.string().min(2).max(160)
});

export const charitySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120),
  description: z.string().min(20).max(3000),
  category: z.string().min(2).max(80),
  featured: z.boolean().default(false),
  imageUrl: z.url(),
  events: z.array(charityEventSchema).default([])
});

export type CharityInput = z.infer<typeof charitySchema>;
