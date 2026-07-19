import { prisma } from "@/lib/prisma";

export async function getAccountsWithBalances(userId: string) {
  const [accounts, sums] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.transaction.groupBy({
      by: ["accountId", "type"],
      where: { userId },
      _sum: { amount: true },
    }),
  ]);

  const balanceByAccount = new Map<string, number>();
  for (const account of accounts) {
    balanceByAccount.set(account.id, Number(account.startingBalance));
  }
  for (const sum of sums) {
    const current = balanceByAccount.get(sum.accountId) ?? 0;
    const delta = Number(sum._sum.amount ?? 0);
    balanceByAccount.set(
      sum.accountId,
      current + (sum.type === "INCOME" ? delta : -delta),
    );
  }

  return accounts.map((account) => ({
    ...account,
    startingBalance: Number(account.startingBalance),
    balance: balanceByAccount.get(account.id) ?? Number(account.startingBalance),
  }));
}
