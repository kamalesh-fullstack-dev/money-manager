"use client";

import { useTransition } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { deleteRecurring, toggleRecurringActive } from "@/app/(dashboard)/transactions/recurring/actions";
import {
  RecurringForm,
  type AccountOption,
  type CategoryOption,
  type RecurringRecord,
} from "./recurring-form";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export type RecurringRow = RecurringRecord & {
  accountName: string;
  categoryName: string | null;
  nextRunDate: string;
  endDate: string | null;
  isActive: boolean;
};

function ActiveSwitch({ id, isActive }: { id: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isActive}
        disabled={pending}
        className={pending ? "opacity-60" : undefined}
        onCheckedChange={(checked) => startTransition(() => toggleRecurringActive(id, checked))}
      />
      {pending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}

export function RecurringList({
  items,
  accounts,
  categories,
  currency,
}: {
  items: RecurringRow[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <RecurringForm
          accounts={accounts}
          categories={categories}
          trigger={
            <Button>
              <Plus className="size-4" />
              New recurring
            </Button>
          }
        />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recurring transactions yet. Use this for rent, salary, subscriptions, or a
          multi-month EMI purchase.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-3">Description</TableHead>
              <TableHead className="px-3">Frequency</TableHead>
              <TableHead className="px-3">Next due</TableHead>
              <TableHead className="px-3 text-right">Amount</TableHead>
              <TableHead className="w-20 px-3 text-center">Active</TableHead>
              <TableHead className="w-20 px-3" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-3 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{item.categoryName ?? "Uncategorized"}</span>
                    <span className="text-xs text-muted-foreground">{item.accountName}</span>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-3">
                  <Badge variant="secondary">{FREQUENCY_LABELS[item.frequency]}</Badge>
                </TableCell>
                <TableCell className="px-3 py-3 whitespace-nowrap">
                  {item.nextRunDate}
                  {item.endDate && (
                    <div className="text-xs text-muted-foreground">ends {item.endDate}</div>
                  )}
                </TableCell>
                <TableCell
                  className={`px-3 py-3 text-right font-medium ${item.type === "INCOME" ? "text-emerald-500" : ""}`}
                >
                  {item.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(item.amount, currency)}
                </TableCell>
                <TableCell className="px-3 py-3">
                  <div className="flex justify-center">
                    <ActiveSwitch id={item.id} isActive={item.isActive} />
                  </div>
                </TableCell>
                <TableCell className="px-3 py-3">
                  <div className="flex justify-end gap-1">
                    <RecurringForm
                      accounts={accounts}
                      categories={categories}
                      recurring={item}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      }
                    />
                    <DeleteConfirmButton
                      description="This recurring schedule will be deleted. Transactions it already generated are kept."
                      onDelete={() => deleteRecurring(item.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
