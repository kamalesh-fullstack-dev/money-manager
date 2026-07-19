import { getAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPeriodRange } from "@/lib/date-ranges";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionList, type TransactionRow } from "@/components/transactions/transaction-list";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; accountId?: string; categoryId?: string }>;
}) {
  const user = await getAuthedUser();
  const params = await searchParams;
  const month = params.month ?? currentMonth();
  const [year, m] = month.split("-").map(Number);
  const { start, end } = getPeriodRange("MONTHLY", new Date(Date.UTC(year, m - 1, 1)));

  const [transactions, accounts, categories, profile] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: start, lt: end },
        ...(params.accountId ? { accountId: params.accountId } : {}),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      },
      include: { account: true, category: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.profile.findUnique({ where: { id: user.id } }),
  ]);

  const rows: TransactionRow[] = transactions.map((t) => ({
    id: t.id,
    type: t.type as "INCOME" | "EXPENSE",
    amount: Number(t.amount),
    date: toDateInputValue(t.date),
    accountId: t.accountId,
    categoryId: t.categoryId,
    note: t.note,
    accountName: t.account.name,
    categoryName: t.category?.name ?? null,
    categoryColor: t.category?.color ?? null,
  }));

  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));
  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type as "INCOME" | "EXPENSE",
  }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <TransactionFilters month={month} accounts={accountOptions} categories={categoryOptions} />
      <TransactionList
        transactions={rows}
        accounts={accountOptions}
        categories={categoryOptions}
        currency={profile?.currency ?? "USD"}
      />
    </div>
  );
}
