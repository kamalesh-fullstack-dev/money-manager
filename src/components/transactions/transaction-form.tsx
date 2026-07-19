"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTransaction,
  updateTransaction,
} from "@/app/(dashboard)/transactions/actions";
import { transactionSchema, type TransactionInput } from "@/lib/validations/transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { SegmentedToggle } from "@/components/ui/segmented-toggle";

export type AccountOption = { id: string; name: string };
export type CategoryOption = { id: string; name: string; type: "INCOME" | "EXPENSE" };

export type TransactionRecord = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string | number;
  date: string; // YYYY-MM-DD
  accountId: string;
  categoryId: string | null;
  note: string | null;
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  accounts,
  categories,
  transaction,
  trigger,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  transaction?: TransactionRecord;
  trigger: React.ReactNode;
}) {
  const isEdit = !!transaction;
  const action = isEdit ? updateTransaction : createTransaction;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionInput>,
    defaultValues: {
      type: transaction?.type ?? "EXPENSE",
      amount: transaction ? Number(transaction.amount) : ("" as unknown as number),
      date: transaction?.date ?? todayString(),
      accountId: transaction?.accountId ?? accounts[0]?.id ?? "",
      categoryId: transaction?.categoryId ?? "",
      note: transaction?.note ?? "",
    },
  });

  const selectedType = useWatch({ control: form.control, name: "type" });
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === selectedType),
    [categories, selectedType],
  );

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    if (isEdit && transaction) formData.append("id", transaction.id);
    formData.append("type", values.type);
    formData.append("amount", String(values.amount));
    formData.append("date", values.date);
    formData.append("accountId", values.accountId);
    formData.append("categoryId", values.categoryId ?? "");
    formData.append("note", values.note ?? "");
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
              {isEdit ? "Edit transaction" : "New transaction"}
            </SheetTitle>
            <SheetDescription>
              {isEdit ? "Update this transaction." : "Record a new income or expense."}
            </SheetDescription>
          </div>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4 overflow-y-auto">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <SegmentedToggle
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        form.setValue("categoryId", "");
                      }}
                      options={[
                        { value: "EXPENSE", label: "Expense" },
                        { value: "INCOME", label: "Income" },
                      ]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="No category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
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
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="px-0">
              <Button type="submit" disabled={pending || accounts.length === 0}>
                {pending ? "Saving..." : isEdit ? "Save changes" : "Add transaction"}
              </Button>
              {accounts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Create an account first before adding transactions.
                </p>
              )}
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
