"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Wallet, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { getPeriodRange, addPeriods, type Period } from "@/lib/date-ranges";
import { formatPeriodLabel } from "@/lib/format";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "WEEKLY", label: "Week" },
  { value: "MONTHLY", label: "Month" },
  { value: "YEARLY", label: "Year" },
];

export function TransactionFilters({
  period,
  date,
  accounts,
  categories,
}: {
  period: Period;
  date: string;
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Any filter change invalidates whatever page you were on, so page
  // always resets to 1 here rather than carrying over a stale offset.
  function setParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function shiftDate(delta: number) {
    const ref = new Date(`${date}T00:00:00.000Z`);
    const next = addPeriods(period, ref, delta);
    setParams({ date: next.toISOString().slice(0, 10) });
  }

  const refDate = new Date(`${date}T00:00:00.000Z`);
  const { start, end } = getPeriodRange(period, refDate);
  const label = formatPeriodLabel(period, start, end);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-secondary/30 p-2">
      <SegmentedToggle
        value={period}
        onChange={(value) => setParams({ period: value, date: null })}
        options={PERIOD_OPTIONS}
        className="w-auto"
      />

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          className="plate"
          disabled={pending}
          onClick={() => shiftDate(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="stat-value flex min-w-40 items-center justify-center gap-1.5 text-center text-sm font-semibold">
          {label}
          {pending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          className="plate"
          disabled={pending}
          onClick={() => shiftDate(1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Select
        value={searchParams.get("accountId") ?? "all"}
        disabled={pending}
        onValueChange={(v) => setParams({ accountId: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-44">
          <Wallet className="size-3.5 text-muted-foreground" />
          <SelectValue placeholder="All accounts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All accounts</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("categoryId") ?? "all"}
        disabled={pending}
        onValueChange={(v) => setParams({ categoryId: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-44">
          <Tag className="size-3.5 text-muted-foreground" />
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
