"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";

export type CategorySlice = {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
};

const chartConfig = {} satisfies ChartConfig;

export function CategoryPieChart({
  data,
  currency,
}: {
  data: CategorySlice[];
  currency: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
        No expenses this month yet.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-64">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {formatCurrency(Number(value), currency)}
                  </span>
                </span>
              )}
            />
          }
        />
        <Pie data={data} dataKey="amount" nameKey="name" innerRadius={50} outerRadius={90}>
          {data.map((slice) => (
            <Cell key={slice.categoryId} fill={slice.color} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
