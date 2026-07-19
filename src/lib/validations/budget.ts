import { z } from "zod";

export const BUDGET_PERIODS = ["WEEKLY", "MONTHLY", "YEARLY"] as const;

// `rollover` is a plain boolean here since this schema validates both the
// client-side react-hook-form state (a real boolean, for the Switch
// component) and the server action's input - the server action converts
// FormData's "true"/"false" string to a boolean itself before validating,
// so this schema never has to deal with that string form.
export const budgetSchema = z.object({
  categoryId: z.string().uuid("Select a category"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  period: z.enum(BUDGET_PERIODS),
  rollover: z.boolean(),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
