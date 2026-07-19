"use client";

import { Pencil, Plus } from "lucide-react";
import { deleteTransaction } from "@/app/(dashboard)/transactions/actions";
import {
  TransactionForm,
  type AccountOption,
  type CategoryOption,
  type TransactionRecord,
} from "./transaction-form";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";

export type TransactionRow = TransactionRecord & {
  accountName: string;
  categoryName: string | null;
  categoryColor: string | null;
};

export function TransactionList({
  transactions,
  accounts,
  categories,
  currency,
}: {
  transactions: TransactionRow[];
  accounts: AccountOption[];
  categories: CategoryOption[];
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <TransactionForm
          accounts={accounts}
          categories={categories}
          trigger={
            <Button>
              <Plus className="size-4" />
              Add transaction
            </Button>
          }
        />
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No transactions for this period.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="whitespace-nowrap">{t.date}</TableCell>
                <TableCell>
                  {t.categoryName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: t.categoryColor ?? "#888" }}
                      />
                      {t.categoryName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Uncategorized</span>
                  )}
                </TableCell>
                <TableCell>{t.accountName}</TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {t.note}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${t.type === "INCOME" ? "text-emerald-500" : ""}`}
                >
                  {t.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(t.amount, currency)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <TransactionForm
                      accounts={accounts}
                      categories={categories}
                      transaction={t}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      }
                    />
                    <DeleteConfirmButton
                      description="This transaction will be permanently deleted."
                      onDelete={() => deleteTransaction(t.id)}
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
