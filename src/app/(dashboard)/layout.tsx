import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/ensure-profile";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { UserMenu } from "@/components/dashboard/user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects unauthenticated requests away from these
  // routes; this is a defense-in-depth check for direct server rendering.
  if (!user) {
    redirect("/login");
  }

  await ensureProfile(user.id, user.email!);

  return (
    <div className="min-h-svh md:grid md:grid-cols-[220px_1fr]">
      <aside className="hidden border-r p-4 md:flex md:flex-col md:gap-4">
        <span className="px-3 text-lg font-semibold">Money Manager</span>
        <SidebarNav />
      </aside>
      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3 md:justify-end">
          <span className="text-lg font-semibold md:hidden">Money Manager</span>
          <UserMenu email={user.email!} />
        </header>
        <main className="flex-1 p-4 pb-20 md:pb-4">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
