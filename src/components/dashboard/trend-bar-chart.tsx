"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";

export type TrendPoint = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

const chartConfig = {
  income: { label: "Income", color: "#10b981" },
  expense: { label: "Expense", color: "var(--primary)" },
} satisfies ChartConfig;

export function TrendBarChart({
  data,
  currency,
}: {
  data: TrendPoint[];
  currency: string;
}) {
  return (
    <ChartContainer config={chartConfig} className="max-h-64 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground capitalize">{name}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatCurrency(Number(value), currency)}
                  </span>
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="income" fill="var(--color-income)" radius={2} />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={2} />
      </BarChart>
    </ChartContainer>
  );
}
