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

  const rows: BudgetRow[] = await Promise.all(
    budgets.map(async (budget) => {
      const period = budget.period as Period;
      const { start, end } = getPeriodRange(period, now);
      const spentAgg = await prisma.transaction.aggregate({
        where: {
          userId: user.id,
          categoryId: budget.categoryId,
          type: "EXPENSE",
          date: { gte: start, lt: end },
        },
        _sum: { amount: true },
      });
      const spent = Number(spentAgg._sum.amount ?? 0);
      const amount = Number(budget.amount);

      let effectiveLimit = amount;
      if (budget.rollover) {
        const prevRange = getPreviousPeriodRange(period, now);
        const prevSpentAgg = await prisma.transaction.aggregate({
          where: {
            userId: user.id,
            categoryId: budget.categoryId,
            type: "EXPENSE",
            date: { gte: prevRange.start, lt: prevRange.end },
          },
          _sum: { amount: true },
        });
        const prevSpent = Number(prevSpentAgg._sum.amount ?? 0);
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
    }),
  );

  const categoryOptions = expenseCategories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Budgets</h1>
      <BudgetList
        budgets={rows}
        categories={categoryOptions}
        currency={profile?.currency ?? "USD"}
      />
    </div>
  );
}
