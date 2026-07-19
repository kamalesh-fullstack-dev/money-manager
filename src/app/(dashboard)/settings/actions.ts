"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthedUser } from "@/lib/auth";
import { categorySchema } from "@/lib/validations/category";
import { CURRENCY_CODES } from "@/lib/currencies";

export type ActionState = { error: string } | null;

export async function createCategory(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getAuthedUser();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.category.findFirst({
    where: { userId: user.id, name: parsed.data.name, type: parsed.data.type },
  });
  if (existing) {
    return { error: "A category with this name and type already exists" };
  }

  await prisma.category.create({
    data: { ...parsed.data, userId: user.id },
  });

  revalidatePath("/settings");
  revalidatePath("/transactions");
  return null;
}

export async function updateCurrency(currency: string) {
  const user = await getAuthedUser();
  if (!CURRENCY_CODES.includes(currency as (typeof CURRENCY_CODES)[number])) {
    return;
  }
  await prisma.profile.update({ where: { id: user.id }, data: { currency } });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
}

export async function deleteCategory(id: string) {
  const user = await getAuthedUser();
  const category = await prisma.category.findFirst({ where: { id, userId: user.id } });
  if (!category || category.isDefault) {
    return;
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/settings");
  revalidatePath("/transactions");
}
