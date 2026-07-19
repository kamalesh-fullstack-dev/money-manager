"use client";

import { useState } from "react";
import { TrendBarChart, type TrendPoint } from "./trend-bar-chart";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Granularity = "WEEKLY" | "MONTHLY" | "YEARLY";

export function TrendChartCard({
  weekly,
  monthly,
  yearly,
  currency,
}: {
  weekly: TrendPoint[];
  monthly: TrendPoint[];
  yearly: TrendPoint[];
  currency: string;
}) {
  const [granularity, setGranularity] = useState<Granularity>("MONTHLY");
  const data = granularity === "WEEKLY" ? weekly : granularity === "YEARLY" ? yearly : monthly;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Income vs. expense</CardTitle>
        <SegmentedToggle
          value={granularity}
          onChange={setGranularity}
          className="w-auto"
          options={[
            { value: "WEEKLY", label: "Week" },
            { value: "MONTHLY", label: "Month" },
            { value: "YEARLY", label: "Year" },
          ]}
        />
      </CardHeader>
      <CardContent>
        <TrendBarChart data={data} currency={currency} />
      </CardContent>
    </Card>
  );
}
