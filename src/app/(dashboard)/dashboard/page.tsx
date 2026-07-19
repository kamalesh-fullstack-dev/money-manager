import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Signed in as {user?.email}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Auth, database, and the responsive shell are wired up. Transaction
          tracking, budgets, and charts land in the next phase.
        </CardContent>
      </Card>
    </div>
  );
}
