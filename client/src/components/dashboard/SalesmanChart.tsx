import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { SalesmanPerformanceItem } from "@/types/dashboard";

interface SalesmanChartProps {
  data: SalesmanPerformanceItem[];
  loading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export function SalesmanChart({ data, loading }: SalesmanChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-48 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-44 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Salesman Performance</CardTitle>
          <CardDescription>Total sales amount per salesman</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-44 text-muted-foreground text-sm">
          No salesman data available
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 8).map((s) => ({
    ...s,
    shortName: s.name.length > 12 ? s.name.slice(0, 11) + "…" : s.name,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Salesman Performance</CardTitle>
        <CardDescription>Total sales amount per salesman this year</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="shortName" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
            <YAxis
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 10 }}
              stroke="var(--muted-foreground)"
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), "Sales"]}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="totalAmount" fill="#a855f7" radius={[4, 4, 0, 0]} name="Sales Amount" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
