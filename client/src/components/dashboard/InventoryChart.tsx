// import React from "react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { InventoryGroupItem } from "@/types/dashboard";

interface InventoryChartProps {
  data: InventoryGroupItem[];
  loading: boolean;
}

const COLORS = [
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#a855f7",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
  "#22c55e",
  "#ec4899",
  "#6366f1",
];

export function InventoryChart({ data, loading }: InventoryChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-40 animate-pulse" />
          <div className="h-3 bg-muted rounded w-28 animate-pulse mt-1" />
        </CardHeader>
        <CardContent>
          <div className="h-52 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Inventory by Product Group
          </CardTitle>
          <CardDescription>Current stock levels</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-52 text-muted-foreground text-sm">
          No inventory data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Inventory by Product Group</CardTitle>
        <CardDescription>Current total stock units per group</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              stroke="var(--muted-foreground)"
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              stroke="var(--muted-foreground)"
              width={90}
            />
            <Tooltip
              formatter={(value: number | undefined) => {
                if (value === undefined) return ["0 units", "Stock"];
                return [value.toLocaleString("en-IN") + " units", "Stock"];
              }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="totalStock" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
