"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthedUser } from "@/lib/auth";
import { accountSchema } from "@/lib/validations/account";

export type ActionState = { error: string } | null;

export async function createAccount(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getAuthedUser();
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    startingBalance: formData.get("startingBalance"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.account.create({
    data: { ...parsed.data, userId: user.id },
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return null;
}

export async function updateAccount(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getAuthedUser();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing account id" };
  }
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    startingBalance: formData.get("startingBalance"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.account.updateMany({
    where: { id, userId: user.id },
    data: parsed.data,
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  return null;
}

export async function deleteAccount(id: string) {
  const user = await getAuthedUser();
  await prisma.account.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}
