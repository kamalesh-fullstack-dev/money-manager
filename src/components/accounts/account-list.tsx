"use client";

import { Pencil, Plus } from "lucide-react";
import { deleteAccount } from "@/app/(dashboard)/accounts/actions";
import { AccountForm } from "./account-form";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { Button } from "@/components/ui/button";
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
import { ACCOUNT_TYPES } from "@/lib/validations/account";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK: "Bank",
  CREDIT_CARD: "Credit card",
  WALLET: "Wallet",
  OTHER: "Other",
};

export type AccountWithBalance = {
  id: string;
  name: string;
  type: (typeof ACCOUNT_TYPES)[number];
  startingBalance: string | number;
  balance: number;
};

export function AccountList({
  accounts,
  currency,
}: {
  accounts: AccountWithBalance[];
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AccountForm
          trigger={
            <Button>
              <Plus className="size-4" />
              New account
            </Button>
          }
        />
      </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No accounts yet. Add one to start tracking transactions.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${account.balance < 0 ? "text-destructive" : ""}`}
                >
                  {formatCurrency(account.balance, currency)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <AccountForm
                      account={account}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      }
                    />
                    <DeleteConfirmButton
                      description={`This will delete "${account.name}" and all of its transactions. This can't be undone.`}
                      onDelete={() => deleteAccount(account.id)}
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
