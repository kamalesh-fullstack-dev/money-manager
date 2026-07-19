"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthedUser } from "@/lib/auth";
import { budgetSchema } from "@/lib/validations/budget";

export type ActionState = { error: string } | null;

const DUPLICATE_ERROR = "A budget already exists for this category and period";

function parseForm(formData: FormData) {
  return budgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    period: formData.get("period"),
    rollover: formData.get("rollover") === "true",
  });
}

export async function createBudget(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getAuthedUser();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, userId: user.id, type: "EXPENSE" },
  });
  if (!category) {
    return { error: "Select a valid expense category" };
  }

  try {
    await prisma.budget.create({
      data: { ...parsed.data, userId: user.id },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: DUPLICATE_ERROR };
    }
    throw err;
  }

  revalidatePath("/budgets");
  return null;
}

export async function updateBudget(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getAuthedUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing budget id" };
  }
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, userId: user.id, type: "EXPENSE" },
  });
  if (!category) {
    return { error: "Select a valid expense category" };
  }

  try {
    await prisma.budget.updateMany({
      where: { id, userId: user.id },
      data: parsed.data,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: DUPLICATE_ERROR };
    }
    throw err;
  }

  revalidatePath("/budgets");
  return null;
}

export async function deleteBudget(id: string) {
  const user = await getAuthedUser();
  await prisma.budget.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/budgets");
}
