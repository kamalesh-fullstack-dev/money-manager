import { getAuthedUser } from "@/lib/auth";
import { ensureProfile } from "@/lib/ensure-profile";
import { processDueRecurringTransactions } from "@/lib/recurring";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { UserMenu } from "@/components/dashboard/user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthedUser();

  await ensureProfile(user.id, user.email!);
  await processDueRecurringTransactions(user.id);

  return (
    <div className="min-h-svh md:grid md:grid-cols-[220px_1fr]">
      <aside className="hidden flex-col gap-4 border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground md:flex">
        <div className="flex flex-col gap-3">
          <span className="px-1 font-display text-xl font-extrabold tracking-wide text-primary uppercase">
            Money Manager
          </span>
          <div className="hazard-stripe h-1.5 w-full" />
        </div>
        <SidebarNav />
      </aside>
      <div className="flex flex-col">
        <div className="hazard-stripe h-1.5 w-full" />
        <header className="flex items-center justify-between border-b px-4 py-3 md:justify-end">
          <span className="font-display text-xl font-extrabold tracking-wide text-primary uppercase md:hidden">
            Money Manager
          </span>
          <UserMenu email={user.email!} />
        </header>
        <main className="flex-1 p-4 pb-20 md:pb-4">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
