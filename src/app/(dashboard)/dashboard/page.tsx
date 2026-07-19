import Link from "next/link";
import { getAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountsWithBalances } from "@/lib/balances";
import { getPeriodRange, addPeriods, type Period } from "@/lib/date-ranges";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryPieChart, type CategorySlice } from "@/components/dashboard/category-pie-chart";
import { TrendChartCard } from "@/components/dashboard/trend-chart-card";
import type { TrendPoint } from "@/components/dashboard/trend-bar-chart";

const UNCATEGORIZED_COLOR = "var(--chart-4)";

function formatTrendLabel(period: Period, start: Date) {
  if (period === "YEARLY") return String(start.getUTCFullYear());
  if (period === "WEEKLY") {
    return start.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  }
  return start.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
}

type TrendTx = { date: Date; type: string; amount: unknown };

// Buckets an already-fetched transaction list into period buckets in JS.
// The three granularities all read from one shared fetch (see
// `getTrendTransactions` below) rather than each running its own query -
// running one groupBy per bucket instead (24 of them across three
// granularities) was making the dashboard take 10+ seconds to load.
function bucketTrend(
  transactions: TrendTx[],
  period: Period,
  count: number,
  now: Date,
): TrendPoint[] {
  const buckets = Array.from({ length: count }, (_, i) => {
    const ref = addPeriods(period, now, -(count - 1 - i));
    return getPeriodRange(period, ref);
  });

  return buckets.map(({ start, end }) => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.date < start || t.date >= end) continue;
      if (t.type === "INCOME") income += Number(t.amount);
      else if (t.type === "EXPENSE") expense += Number(t.amount);
    }
    return {
      key: start.toISOString().slice(0, 10),
      label: formatTrendLabel(period, start),
      income,
      expense,
    };
  });
}

export default async function DashboardPage() {
  const user = await getAuthedUser();
  const now = new Date();
  const { start, end } = getPeriodRange("MONTHLY", now);
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Yearly (5 years back) is the widest range needed across the three
  // trend granularities, so one fetch covers weekly/monthly/yearly.
  const trendRangeStart = getPeriodRange("YEARLY", addPeriods("YEARLY", now, -4)).start;

  const [
    profile,
    accounts,
    monthSums,
    recentTransactions,
    categoryBreakdown,
    categories,
    trendTransactions,
  ] = await Promise.all([
    prisma.profile.findUnique({ where: { id: user.id } }),
    getAccountsWithBalances(user.id),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId: user.id, date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      include: { account: true, category: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId: user.id, type: "EXPENSE", date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.category.findMany({ where: { userId: user.id } }),
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: trendRangeStart } },
      select: { date: true, type: true, amount: true },
    }),
  ]);

  const weeklyTrend = bucketTrend(trendTransactions, "WEEKLY", 8, now);
  const monthlyTrend = bucketTrend(trendTransactions, "MONTHLY", 6, now);
  const yearlyTrend = bucketTrend(trendTransactions, "YEARLY", 5, now);

  const currency = profile?.currency ?? "USD";
  const income = Number(monthSums.find((s) => s.type === "INCOME")?._sum.amount ?? 0);
  const expense = Number(monthSums.find((s) => s.type === "EXPENSE")?._sum.amount ?? 0);
  const net = income - expense;

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const categorySlices: CategorySlice[] = categoryBreakdown
    .map((row) => {
      const category = row.categoryId ? categoryById.get(row.categoryId) : undefined;
      return {
        categoryId: row.categoryId ?? "uncategorized",
        name: category?.name ?? "Uncategorized",
        color: category?.color ?? UNCATEGORIZED_COLOR,
        amount: Number(row._sum.amount ?? 0),
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{formatMonthLabel(month)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-t-4 border-t-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Income
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-value text-2xl font-bold text-emerald-500">
            {formatCurrency(income, currency)}
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="stat-value text-2xl font-bold text-primary">
            {formatCurrency(expense, currency)}
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-foreground/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Net
            </CardTitle>
          </CardHeader>
          <CardContent
            className={`stat-value text-2xl font-bold ${net < 0 ? "text-primary" : ""}`}
          >
            {formatCurrency(net, currency)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={categorySlices} currency={currency} />
          </CardContent>
        </Card>

        <TrendChartCard
          weekly={weeklyTrend}
          monthly={monthlyTrend}
          yearly={yearlyTrend}
          currency={currency}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accounts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No accounts yet.{" "}
                <Link href="/accounts" className="underline underline-offset-4">
                  Add one
                </Link>
                .
              </p>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between text-sm">
                  <span>{account.name}</span>
                  <span className={`font-medium ${account.balance < 0 ? "text-destructive" : ""}`}>
                    {formatCurrency(account.balance, currency)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent transactions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions yet.{" "}
                <Link href="/transactions" className="underline underline-offset-4">
                  Add one
                </Link>
                .
              </p>
            ) : (
              recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span>{t.category?.name ?? "Uncategorized"}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.account.name} &middot; {t.date.toISOString().slice(0, 10)}
                    </span>
                  </div>
                  <span
                    className={`font-medium ${t.type === "INCOME" ? "text-emerald-500" : ""}`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(Number(t.amount), currency)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
