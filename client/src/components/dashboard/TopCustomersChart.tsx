import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { TopCustomerItem } from "@/types/dashboard";

interface TopCustomersChartProps {
  data: TopCustomerItem[];
  loading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const COLORS = ["#3b82f6","#60a5fa","#93c5fd","#bfdbfe","#dbeafe"];

export function TopCustomersChart({ data, loading }: TopCustomersChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-40 animate-pulse" />
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
          <CardTitle className="text-base">Top Customers</CardTitle>
          <CardDescription>By revenue this year</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-44 text-muted-foreground text-sm">
          No customer data available
        </CardContent>
      </Card>
    );
  }

  // Shorten names for chart labels
  const chartData = data.map((c) => ({
    ...c,
    shortName: c.name.length > 14 ? c.name.slice(0, 13) + "…" : c.name,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top 5 Customers</CardTitle>
        <CardDescription>By revenue this year</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
              stroke="var(--muted-foreground)"
            />
            <YAxis
              type="category"
              dataKey="shortName"
              tick={{ fontSize: 11 }}
              stroke="var(--muted-foreground)"
              width={95}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), "Revenue"]}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="totalAmount" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
