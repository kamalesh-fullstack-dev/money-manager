import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(40),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
