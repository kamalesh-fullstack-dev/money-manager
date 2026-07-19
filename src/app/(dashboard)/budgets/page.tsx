import { getAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPeriodRange, getPreviousPeriodRange, type Period } from "@/lib/date-ranges";
import { BudgetList, type BudgetRow } from "@/components/budgets/budget-list";

export default async function BudgetsPage() {
  const user = await getAuthedUser();
  const now = new Date();

  const [budgets, expenseCategories, profile] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: user.id },
      include: { category: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.category.findMany({
      where: { userId: user.id, type: "EXPENSE" },
      orderBy: { name: "asc" },
    }),
    prisma.profile.findUnique({ where: { id: user.id } }),
  ]);

  // Fetch every budgeted category's relevant transactions in one query and
  // sum them in JS, rather than running 1-2 aggregate queries per budget
  // (2N+ round-trips to the DB) - that N+1 pattern was making this page
  // slow for the same reason the dashboard trend chart was.
  const categoryIds = [...new Set(budgets.map((b) => b.categoryId))];

  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  for (const budget of budgets) {
    const period = budget.period as Period;
    const { start, end } = getPeriodRange(period, now);
    if (!rangeStart || start < rangeStart) rangeStart = start;
    if (!rangeEnd || end > rangeEnd) rangeEnd = end;
    if (budget.rollover) {
      const prev = getPreviousPeriodRange(period, now);
      if (prev.start < rangeStart) rangeStart = prev.start;
    }
  }

  const relevantTransactions =
    categoryIds.length > 0 && rangeStart && rangeEnd
      ? await prisma.transaction.findMany({
          where: {
            userId: user.id,
            type: "EXPENSE",
            categoryId: { in: categoryIds },
            date: { gte: rangeStart, lt: rangeEnd },
          },
          select: { categoryId: true, date: true, amount: true },
        })
      : [];

  function sumSpent(categoryId: string, start: Date, end: Date) {
    let total = 0;
    for (const t of relevantTransactions) {
      if (t.categoryId === categoryId && t.date >= start && t.date < end) {
        total += Number(t.amount);
      }
    }
    return total;
  }

  const rows: BudgetRow[] = budgets.map((budget) => {
    const period = budget.period as Period;
    const { start, end } = getPeriodRange(period, now);
    const spent = sumSpent(budget.categoryId, start, end);
    const amount = Number(budget.amount);

    let effectiveLimit = amount;
    if (budget.rollover) {
      const prevRange = getPreviousPeriodRange(period, now);
      const prevSpent = sumSpent(budget.categoryId, prevRange.start, prevRange.end);
      effectiveLimit += Math.max(0, amount - prevSpent);
    }

    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      categoryColor: budget.category.color,
      period,
      amount,
      rollover: budget.rollover,
      effectiveLimit,
      spent,
    };
  });

  const categoryOptions = expenseCategories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Budgets</h1>
      <BudgetList
        budgets={rows}
        categories={categoryOptions}
        currency={profile?.currency ?? "USD"}
      />
    </div>
  );
}
