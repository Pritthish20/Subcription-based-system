import { z } from "zod";

export { charitySchema, type CharityInput } from "../../../shared/src/index";

export const charityListQuerySchema = z.object({
  search: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => (Array.isArray(value) ? value[0] ?? "" : value ?? ""))
});

export const charitySlugParamSchema = z.object({
  slug: z.string().min(2).max(120)
});

export type CharityListQuery = z.infer<typeof charityListQuerySchema>;
export type CharitySlugParam = z.infer<typeof charitySlugParamSchema>;

