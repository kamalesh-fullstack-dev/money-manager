import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORIES } from "../../prisma/default-categories";

// Supabase owns auth.users; this creates the matching app-side Profile row
// (plus starter categories) the first time a user is seen, since there's
// no on-signup DB trigger wired up yet — see plan phase 1 scope.
export async function ensureProfile(userId: string, email: string) {
  const profile = await prisma.profile.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email },
  });

  const categoryCount = await prisma.category.count({ where: { userId } });
  if (categoryCount === 0) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId, isDefault: true })),
    });
  }

  return profile;
}
