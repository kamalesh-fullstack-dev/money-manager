import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  accountId: z.string().uuid("Select an account"),
  categoryId: z.string().uuid("Select a category").optional().or(z.literal("")),
  note: z.string().max(280).optional().or(z.literal("")),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
