"use client";

import { Banknote, CreditCard, Landmark, Pencil, Plus, Wallet as WalletIcon } from "lucide-react";
import { deleteAccount } from "@/app/(dashboard)/accounts/actions";
import { AccountForm } from "./account-form";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_TYPES } from "@/lib/validations/account";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: "Cash",
  BANK: "Bank",
  CREDIT_CARD: "Credit card",
  WALLET: "Wallet",
  OTHER: "Other",
};

const ACCOUNT_TYPE_ICONS: Record<string, typeof Banknote> = {
  CASH: Banknote,
  BANK: Landmark,
  CREDIT_CARD: CreditCard,
  WALLET: WalletIcon,
  OTHER: WalletIcon,
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const Icon = ACCOUNT_TYPE_ICONS[account.type] ?? WalletIcon;
            return (
              <Card key={account.id} className="border-t-4 border-t-primary">
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="plate flex size-9 items-center justify-center bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold">{account.name}</p>
                      <Badge variant="secondary" className="mt-0.5">
                        {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
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
                </CardHeader>
                <CardContent>
                  <p
                    className={`stat-value text-2xl font-bold ${account.balance < 0 ? "text-destructive" : ""}`}
                  >
                    {formatCurrency(account.balance, currency)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
