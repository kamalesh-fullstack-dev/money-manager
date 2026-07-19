"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createRecurring,
  updateRecurring,
} from "@/app/(dashboard)/transactions/recurring/actions";
import { recurringSchema, type RecurringInput } from "@/lib/validations/recurring";
import { BUDGET_PERIODS } from "@/lib/validations/budget";
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

export type RecurringRecord = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: string | number;
  accountId: string;
  categoryId: string | null;
  note: string | null;
  frequency: (typeof BUDGET_PERIODS)[number];
  startDate: string; // YYYY-MM-DD
};

const FREQUENCY_LABELS: Record<(typeof BUDGET_PERIODS)[number], string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function RecurringForm({
  accounts,
  categories,
  recurring,
  trigger,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  recurring?: RecurringRecord;
  trigger: React.ReactNode;
}) {
  const isEdit = !!recurring;
  const action = isEdit ? updateRecurring : createRecurring;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<RecurringInput>({
    resolver: zodResolver(recurringSchema) as Resolver<RecurringInput>,
    defaultValues: {
      type: recurring?.type ?? "EXPENSE",
      amount: recurring ? Number(recurring.amount) : ("" as unknown as number),
      accountId: recurring?.accountId ?? accounts[0]?.id ?? "",
      categoryId: recurring?.categoryId ?? "",
      note: recurring?.note ?? "",
      frequency: recurring?.frequency ?? "MONTHLY",
      startDate: recurring?.startDate ?? todayString(),
      installments: "",
    },
  });

  const selectedType = useWatch({ control: form.control, name: "type" });
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === selectedType),
    [categories, selectedType],
  );

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    if (isEdit && recurring) formData.append("id", recurring.id);
    formData.append("type", values.type);
    formData.append("amount", String(values.amount));
    formData.append("accountId", values.accountId);
    formData.append("categoryId", values.categoryId ?? "");
    formData.append("note", values.note ?? "");
    formData.append("frequency", values.frequency);
    formData.append("startDate", values.startDate);
    formData.append("installments", values.installments ? String(values.installments) : "");
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
              {isEdit ? "Edit recurring" : "New recurring"}
            </SheetTitle>
            <SheetDescription>
              For bills, salary, or split purchases (EMI) that repeat on a schedule.
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
                  <FormLabel>Amount per occurrence</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} />
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
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repeats</FormLabel>
                  <FormControl>
                    <SegmentedToggle
                      value={field.value}
                      onChange={field.onChange}
                      options={BUDGET_PERIODS.map((p) => ({
                        value: p,
                        label: FREQUENCY_LABELS[p],
                      }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="installments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of occurrences</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" step="1" placeholder="e.g. 4" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Leave blank to repeat indefinitely (rent, salary). Set to 4 for a 4-month EMI.
                  </p>
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
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="px-0">
              <Button type="submit" disabled={pending || accounts.length === 0}>
                {pending ? "Saving..." : isEdit ? "Save changes" : "Create recurring"}
              </Button>
              {accounts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Create an account first before adding a recurring transaction.
                </p>
              )}
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
