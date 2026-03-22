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
import type { TopProductItem } from "@/types/dashboard";

interface TopProductsChartProps {
  data: TopProductItem[];
  loading: boolean;
}

const COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"];

export function TopProductsChart({ data, loading }: TopProductsChartProps) {
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
          <CardTitle className="text-base">Top Products</CardTitle>
          <CardDescription>By quantity sold</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-44 text-muted-foreground text-sm">
          No product data available
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((p) => ({
    ...p,
    shortName: p.name.length > 16 ? p.name.slice(0, 15) + "…" : p.name,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top 5 Products</CardTitle>
        <CardDescription>By quantity sold this year</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            layout="vertical"
            data={chartData}
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
              dataKey="shortName"
              tick={{ fontSize: 11 }}
              stroke="var(--muted-foreground)"
              width={100}
            />
            <Tooltip
              formatter={(value: number | undefined) => {
                if (value === undefined) return ["0 units", "Qty Sold"];
                return [value.toLocaleString("en-IN") + " units", "Qty Sold"];
              }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="totalQty" radius={[0, 4, 4, 0]}>
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
