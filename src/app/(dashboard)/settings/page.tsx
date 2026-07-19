import { getAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";
import { CurrencyForm } from "@/components/settings/currency-form";

export default async function SettingsPage() {
  const user = await getAuthedUser();
  const [categories, profile] = await Promise.all([
    prisma.category.findMany({
      where: { userId: user.id, type: { in: ["INCOME", "EXPENSE"] } },
      orderBy: { name: "asc" },
    }),
    prisma.profile.findUnique({ where: { id: user.id } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <CurrencyForm currency={profile?.currency ?? "USD"} />
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-medium">Categories</h2>
        <CategoryForm />
      </div>
      <CategoryList
        categories={categories.map((c) => ({
          ...c,
          type: c.type as "INCOME" | "EXPENSE",
        }))}
      />
    </div>
  );
}
