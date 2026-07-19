"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAccount, updateAccount } from "@/app/(dashboard)/accounts/actions";
import { ACCOUNT_TYPES, accountSchema, type AccountInput } from "@/lib/validations/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ACCOUNT_TYPE_LABELS: Record<(typeof ACCOUNT_TYPES)[number], string> = {
  CASH: "Cash",
  BANK: "Bank",
  CREDIT_CARD: "Credit card",
  WALLET: "Wallet",
  OTHER: "Other",
};

type AccountRecord = {
  id: string;
  name: string;
  type: (typeof ACCOUNT_TYPES)[number];
  startingBalance: string | number;
};

export function AccountForm({
  account,
  trigger,
}: {
  account?: AccountRecord;
  trigger: React.ReactNode;
}) {
  const isEdit = !!account;
  const action = isEdit ? updateAccount : createAccount;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<AccountInput>({
    resolver: zodResolver(accountSchema) as Resolver<AccountInput>,
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? "CASH",
      startingBalance: account ? Number(account.startingBalance) : 0,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    if (isEdit && account) formData.append("id", account.id);
    formData.append("name", values.name);
    formData.append("type", values.type);
    formData.append("startingBalance", String(values.startingBalance));
    startTransition(async () => {
      const result = await action(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        setOpen(false);
        form.reset();
      }
    });
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetHeader className="gap-3">
          <div className="hazard-stripe h-1 w-full" />
          <div>
            <SheetTitle className="font-display text-xl font-extrabold tracking-wide uppercase">
              {isEdit ? "Edit account" : "New account"}
            </SheetTitle>
            <SheetDescription>
              {isEdit ? "Update this account's details." : "Add a cash, bank, or card account to track."}
            </SheetDescription>
          </div>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. HDFC Savings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {ACCOUNT_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting balance</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="px-0">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : isEdit ? "Save changes" : "Create account"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
