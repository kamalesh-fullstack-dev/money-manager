import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORIES } from "../../prisma/default-categories";

// Supabase owns auth.users; this creates the matching app-side Profile row
// (plus starter categories) the first time a user is seen, since there's
// no on-signup DB trigger wired up yet — see plan phase 1 scope.
//
// This runs on every dashboard navigation (called from the layout), so the
// common case (profile already exists) must stay a single cheap query —
// the create + category seed only happens once, on a user's first visit.
export async function ensureProfile(userId: string, email: string) {
  const existing = await prisma.profile.findUnique({ where: { id: userId } });
  if (existing) {
    return existing;
  }

  try {
    const profile = await prisma.profile.create({ data: { id: userId, email } });
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId, isDefault: true })),
    });
    return profile;
  } catch {
    // Two concurrent first-visit requests raced to create the profile;
    // the other one won, so just read what it created.
    return prisma.profile.findUniqueOrThrow({ where: { id: userId } });
  }
}
