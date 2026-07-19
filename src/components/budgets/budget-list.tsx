"use client";

import { Pencil, Plus } from "lucide-react";
import { deleteBudget } from "@/app/(dashboard)/budgets/actions";
import { BudgetForm, type BudgetRecord, type CategoryOption } from "./budget-form";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const PERIOD_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export type BudgetRow = BudgetRecord & {
  categoryName: string;
  categoryColor: string;
  effectiveLimit: number;
  spent: number;
};

function flagStyles(percent: number) {
  if (percent >= 100) {
    return {
      label: "Over budget",
      bar: "[&>div]:bg-destructive",
      badge: "border-destructive/40 bg-destructive/10 text-destructive",
    };
  }
  if (percent >= 80) {
    return {
      label: "Caution",
      bar: "[&>div]:bg-amber-500",
      badge: "border-amber-500/40 bg-amber-500/10 text-amber-600",
    };
  }
  return {
    label: "On track",
    bar: "[&>div]:bg-emerald-500",
    badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  };
}

export function BudgetList({
  budgets,
  categories,
  currency,
}: {
  budgets: BudgetRow[];
  categories: CategoryOption[];
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <BudgetForm
          categories={categories}
          trigger={
            <Button>
              <Plus className="size-4" />
              New budget
            </Button>
          }
        />
      </div>

      {budgets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No budgets yet. Set a limit on an expense category to start tracking.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const rawPercent =
              budget.effectiveLimit > 0
                ? (budget.spent / budget.effectiveLimit) * 100
                : budget.spent > 0
                  ? 100
                  : 0;
            const percent = Math.min(100, rawPercent);
            const status = flagStyles(rawPercent);

            return (
              <Card key={budget.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: budget.categoryColor }}
                    />
                    <div>
                      <p className="font-semibold">{budget.categoryName}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {PERIOD_LABELS[budget.period]}
                        {budget.rollover ? " · Rollover" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <BudgetForm
                      categories={categories}
                      budget={budget}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      }
                    />
                    <DeleteConfirmButton
                      description={`Delete the budget for "${budget.categoryName}"? This can't be undone.`}
                      onDelete={() => deleteBudget(budget.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {formatCurrency(budget.spent, currency)}{" "}
                      <span className="text-muted-foreground">
                        of {formatCurrency(budget.effectiveLimit, currency)}
                      </span>
                    </span>
                    <Badge variant="outline" className={status.badge}>
                      {status.label}
                    </Badge>
                  </div>
                  <Progress value={percent} className={status.bar} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
