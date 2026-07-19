import { getAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPeriodRange, type Period } from "@/lib/date-ranges";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionList, type TransactionRow } from "@/components/transactions/transaction-list";
import { TransactionPagination } from "@/components/transactions/transaction-pagination";

const PAGE_SIZE = 25;

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    date?: string;
    accountId?: string;
    categoryId?: string;
    page?: string;
  }>;
}) {
  const user = await getAuthedUser();
  const params = await searchParams;

  const period: Period =
    params.period === "WEEKLY" || params.period === "YEARLY" ? params.period : "MONTHLY";
  const refDateStr = params.date ?? todayString();
  const refDate = new Date(`${refDateStr}T00:00:00.000Z`);
  const { start, end } = getPeriodRange(period, refDate);
  const page = Math.max(1, Number(params.page) || 1);

  const where = {
    userId: user.id,
    date: { gte: start, lt: end },
    ...(params.accountId ? { accountId: params.accountId } : {}),
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
  };

  const [transactions, totalCount, accounts, categories, profile] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.transaction.count({ where }),
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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Transactions</h1>
      <TransactionFilters
        period={period}
        date={refDateStr}
        accounts={accountOptions}
        categories={categoryOptions}
      />
      <TransactionList
        transactions={rows}
        accounts={accountOptions}
        categories={categoryOptions}
        currency={profile?.currency ?? "USD"}
      />
      <TransactionPagination page={page} totalPages={totalPages} />
    </div>
  );
}
