import { z } from "zod";
import { BUDGET_PERIODS } from "./budget";

export const recurringSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  accountId: z.string().uuid("Select an account"),
  categoryId: z.string().uuid("Select a category").optional().or(z.literal("")),
  note: z.string().max(280).optional().or(z.literal("")),
  frequency: z.enum(BUDGET_PERIODS),
  startDate: z.string().min(1, "Start date is required"),
  // Blank = repeats indefinitely (e.g. rent, salary). A positive integer
  // bounds it to that many occurrences (e.g. a 4-month EMI).
  installments: z.coerce.number().int().positive().optional().or(z.literal("")),
});

export type RecurringInput = z.infer<typeof recurringSchema>;
