import { getAuthedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccountsWithBalances } from "@/lib/balances";
import { AccountList } from "@/components/accounts/account-list";

export default async function AccountsPage() {
  const user = await getAuthedUser();
  const [accounts, profile] = await Promise.all([
    getAccountsWithBalances(user.id),
    prisma.profile.findUnique({ where: { id: user.id } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">Accounts</h1>
      <AccountList accounts={accounts} currency={profile?.currency ?? "USD"} />
    </div>
  );
}
