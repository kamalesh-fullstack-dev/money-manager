import Link from "next/link";
import { getAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountsWithBalances } from "@/lib/balances";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return { start, end, month };
}

export default async function DashboardPage() {
  const user = await getAuthedUser();
  const { start, end, month } = currentMonthRange();

  const [profile, accounts, monthSums, recentTransactions] = await Promise.all([
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
  ]);

  const currency = profile?.currency ?? "USD";
  const income = Number(monthSums.find((s) => s.type === "INCOME")?._sum.amount ?? 0);
  const expense = Number(monthSums.find((s) => s.type === "EXPENSE")?._sum.amount ?? 0);
  const net = income - expense;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{formatMonthLabel(month)}</p>
        <div className="hazard-stripe mt-3 h-1.5 w-full" />
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
