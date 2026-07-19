"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthedUser } from "@/lib/auth";
import { transactionSchema } from "@/lib/validations/transaction";

export type ActionState = { error: string } | null;

function parseForm(formData: FormData) {
  return transactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    note: formData.get("note"),
  });
}

export async function createTransaction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getAuthedUser();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const account = await prisma.account.findFirst({
    where: { id: parsed.data.accountId, userId: user.id },
  });
  if (!account) {
    return { error: "Select a valid account" };
  }

  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: parsed.data.accountId,
      categoryId: parsed.data.categoryId || null,
      type: parsed.data.type,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      note: parsed.data.note || null,
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  return null;
}

export async function updateTransaction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getAuthedUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing transaction id" };
  }
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const account = await prisma.account.findFirst({
    where: { id: parsed.data.accountId, userId: user.id },
  });
  if (!account) {
    return { error: "Select a valid account" };
  }

  await prisma.transaction.updateMany({
    where: { id, userId: user.id },
    data: {
      accountId: parsed.data.accountId,
      categoryId: parsed.data.categoryId || null,
      type: parsed.data.type,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      note: parsed.data.note || null,
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  return null;
}

export async function deleteTransaction(id: string) {
  const user = await getAuthedUser();
  await prisma.transaction.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}
