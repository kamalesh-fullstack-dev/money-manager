"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthedUser } from "@/lib/auth";
import { addPeriods, type Period } from "@/lib/date-ranges";
import { recurringSchema } from "@/lib/validations/recurring";

export type ActionState = { error: string } | null;

function parseForm(formData: FormData) {
  return recurringSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    note: formData.get("note"),
    frequency: formData.get("frequency"),
    startDate: formData.get("startDate"),
    installments: formData.get("installments"),
  });
}

async function buildData(userId: string, parsed: ReturnType<typeof parseForm>) {
  if (!parsed.success) return null;
  const { data } = parsed;

  const account = await prisma.account.findFirst({
    where: { id: data.accountId, userId },
  });
  if (!account) return null;

  const startDate = new Date(`${data.startDate}T00:00:00.000Z`);
  const endDate =
    data.installments && data.installments > 0
      ? addPeriods(data.frequency as Period, startDate, data.installments - 1)
      : null;

  return {
    userId,
    accountId: data.accountId,
    categoryId: data.categoryId || null,
    type: data.type,
    amount: data.amount,
    note: data.note || null,
    frequency: data.frequency,
    startDate,
    endDate,
  };
}

export async function createRecurring(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getAuthedUser();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = await buildData(user.id, parsed);
  if (!data) {
    return { error: "Select a valid account" };
  }

  await prisma.recurringTransaction.create({
    data: { ...data, nextRunDate: data.startDate },
  });

  revalidatePath("/transactions/recurring");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return null;
}

export async function updateRecurring(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getAuthedUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing recurring transaction id" };
  }
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = await buildData(user.id, parsed);
  if (!data) {
    return { error: "Select a valid account" };
  }

  const existing = await prisma.recurringTransaction.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return { error: "Recurring transaction not found" };
  }

  // Editing restarts the schedule from the new start date rather than
  // trying to reconcile against whatever's already been generated.
  await prisma.recurringTransaction.updateMany({
    where: { id, userId: user.id },
    data: { ...data, nextRunDate: data.startDate, isActive: true },
  });

  revalidatePath("/transactions/recurring");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return null;
}

export async function deleteRecurring(id: string) {
  const user = await getAuthedUser();
  await prisma.recurringTransaction.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/transactions/recurring");
}

export async function toggleRecurringActive(id: string, isActive: boolean) {
  const user = await getAuthedUser();
  await prisma.recurringTransaction.updateMany({
    where: { id, userId: user.id },
    data: { isActive },
  });
  revalidatePath("/transactions/recurring");
}
