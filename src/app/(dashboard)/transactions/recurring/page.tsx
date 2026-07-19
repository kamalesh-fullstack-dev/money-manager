import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecurringList, type RecurringRow } from "@/components/recurring/recurring-list";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function RecurringPage() {
  const user = await getAuthedUser();

  const [recurring, accounts, categories, profile] = await Promise.all([
    prisma.recurringTransaction.findMany({
      where: { userId: user.id },
      include: { account: true, category: true },
      orderBy: [{ isActive: "desc" }, { nextRunDate: "asc" }],
    }),
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.profile.findUnique({ where: { id: user.id } }),
  ]);

  const rows: RecurringRow[] = recurring.map((r) => ({
    id: r.id,
    type: r.type as "INCOME" | "EXPENSE",
    amount: Number(r.amount),
    accountId: r.accountId,
    categoryId: r.categoryId,
    note: r.note,
    frequency: r.frequency as RecurringRow["frequency"],
    startDate: toDateInputValue(r.startDate),
    nextRunDate: toDateInputValue(r.nextRunDate),
    endDate: r.endDate ? toDateInputValue(r.endDate) : null,
    isActive: r.isActive,
    accountName: r.account.name,
    categoryName: r.category?.name ?? null,
  }));

  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));
  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type as "INCOME" | "EXPENSE",
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Transactions
        </Link>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-wide uppercase">
          Recurring
        </h1>
      </div>
      <RecurringList
        items={rows}
        accounts={accountOptions}
        categories={categoryOptions}
        currency={profile?.currency ?? "USD"}
      />
    </div>
  );
}
