import { z } from "zod";

export const ACCOUNT_TYPES = ["CASH", "BANK", "CREDIT_CARD", "WALLET", "OTHER"] as const;

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  type: z.enum(ACCOUNT_TYPES),
  startingBalance: z.coerce.number().finite("Enter a valid amount"),
});

export type AccountInput = z.infer<typeof accountSchema>;
