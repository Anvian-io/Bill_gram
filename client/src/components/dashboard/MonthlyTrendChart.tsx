import React, { useState } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MonthlyTrendItem } from "@/types/dashboard";

interface MonthlyTrendChartProps {
  data: MonthlyTrendItem[];
  loading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const CustomTooltipAmount = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTooltipQty = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value.toLocaleString("en-IN")} units
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function MonthlyTrendChart({ data, loading }: MonthlyTrendChartProps) {
  const [mode, setMode] = useState<"amount" | "qty">("amount");

  const skeleton = (
    <div className="h-64 flex items-center justify-center">
      <div className="w-full h-full bg-muted animate-pulse rounded" />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base">Monthly Sales vs Purchase</CardTitle>
            <CardDescription>
              {mode === "amount" ? "Invoice amounts (₹)" : "Quantity units sold/purchased"}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={mode === "amount" ? "default" : "outline"}
              onClick={() => setMode("amount")}
            >
              Amount
            </Button>
            <Button
              size="sm"
              variant={mode === "qty" ? "default" : "outline"}
              onClick={() => setMode("qty")}
            >
              Quantity
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? skeleton : (
          mode === "amount" ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip content={<CustomTooltipAmount />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="salesAmount"
                  name="Sales"
                  stroke="#3b82f6"
                  fill="url(#salesGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="purchaseAmount"
                  name="Purchase"
                  stroke="#f97316"
                  fill="url(#purchaseGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip content={<CustomTooltipQty />} />
                <Legend />
                <Bar dataKey="salesQty" name="Sales Qty" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchaseQty" name="Purchase Qty" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        )}
      </CardContent>
    </Card>
  );
}
