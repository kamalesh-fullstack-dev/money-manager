"use client";

import { useTransition } from "react";
import { Coins, Loader2 } from "lucide-react";
import { updateCurrency } from "@/app/(dashboard)/settings/actions";
import { CURRENCIES } from "@/lib/currencies";
import { getCurrencySymbol } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CurrencyForm({ currency }: { currency: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Card className="border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Currency
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="stat-value plate flex size-12 items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
            {getCurrencySymbol(currency)}
          </span>
          <div className="flex flex-col">
            <span className="font-display text-lg font-extrabold tracking-wide uppercase">
              {currency}
            </span>
            <span className="text-xs text-muted-foreground">
              Applied across accounts, budgets & transactions
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          <Select
            value={currency}
            disabled={pending}
            onValueChange={(value) => startTransition(() => updateCurrency(value))}
          >
            <SelectTrigger className="w-full sm:w-56">
              <Coins className="size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
