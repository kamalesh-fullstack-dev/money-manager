"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBudget, updateBudget } from "@/app/(dashboard)/budgets/actions";
import { BUDGET_PERIODS, budgetSchema, type BudgetInput } from "@/lib/validations/budget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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

export type CategoryOption = { id: string; name: string };

export type BudgetRecord = {
  id: string;
  categoryId: string;
  amount: string | number;
  period: (typeof BUDGET_PERIODS)[number];
  rollover: boolean;
};

const PERIOD_LABELS: Record<(typeof BUDGET_PERIODS)[number], string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

export function BudgetForm({
  categories,
  budget,
  trigger,
}: {
  categories: CategoryOption[];
  budget?: BudgetRecord;
  trigger: React.ReactNode;
}) {
  const isEdit = !!budget;
  const action = isEdit ? updateBudget : createBudget;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema) as Resolver<BudgetInput>,
    defaultValues: {
      categoryId: budget?.categoryId ?? categories[0]?.id ?? "",
      amount: budget ? Number(budget.amount) : ("" as unknown as number),
      period: budget?.period ?? "MONTHLY",
      rollover: budget?.rollover ?? false,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData();
    if (isEdit && budget) formData.append("id", budget.id);
    formData.append("categoryId", values.categoryId);
    formData.append("amount", String(values.amount));
    formData.append("period", values.period);
    formData.append("rollover", String(values.rollover));
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
              {isEdit ? "Edit budget" : "New budget"}
            </SheetTitle>
            <SheetDescription>
              {isEdit ? "Update this budget's limit." : "Set a spending limit for a category."}
            </SheetDescription>
          </div>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Create an expense category first (Settings) before setting a budget.
              </p>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((c) => (
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limit</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period</FormLabel>
                      <FormControl>
                        <SegmentedToggle
                          value={field.value}
                          onChange={field.onChange}
                          options={BUDGET_PERIODS.map((p) => ({
                            value: p,
                            label: PERIOD_LABELS[p],
                          }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rollover"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border border-input px-3 py-2">
                      <div>
                        <FormLabel>Roll over unused amount</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Last period&apos;s leftover adds to this period&apos;s limit.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <SheetFooter className="px-0">
              <Button type="submit" disabled={pending || categories.length === 0}>
                {pending ? "Saving..." : isEdit ? "Save changes" : "Create budget"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
