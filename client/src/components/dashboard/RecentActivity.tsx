import React from "react";
import { format } from "date-fns";
import { ShoppingCart, Receipt, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RecentActivity as RecentActivityType } from "@/types/dashboard";

interface RecentActivityProps {
  data: RecentActivityType | null;
  loading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const statusVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Paid": return "default";
    case "Pending": return "secondary";
    case "Cancelled": return "destructive";
    default: return "outline";
  }
};

const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3 border-b border-border last:border-0 animate-pulse">
    <div className="w-8 h-8 bg-muted rounded-full" />
    <div className="flex-1 space-y-1">
      <div className="h-3 bg-muted rounded w-32" />
      <div className="h-2 bg-muted rounded w-20" />
    </div>
    <div className="h-3 bg-muted rounded w-16" />
  </div>
);

export function RecentActivity({ data, loading }: RecentActivityProps) {
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <CardDescription>Last 5 sales and purchases</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sales">
          <TabsList className="mb-3">
            <TabsTrigger value="sales" className="flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" /> Sales
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-1">
              <ShoppingCart className="w-3.5 h-3.5" /> Purchases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : !data?.recentSales?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent sales</p>
            ) : (
              data.recentSales.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-3 border-b border-border last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.partyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.invoiceNo || `#${item.id}`} · {format(new Date(item.invoiceDate), "dd MMM yy")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">{formatCurrency(item.finalAmount)}</span>
                    <Badge variant={statusVariant(item.status)} className="text-xs px-1.5 py-0">
                      {item.status || "—"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="purchases">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            ) : !data?.recentPurchases?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent purchases</p>
            ) : (
              data.recentPurchases.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-3 border-b border-border last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.partyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.invoiceNo || `#${item.id}`} · {format(new Date(item.invoiceDate), "dd MMM yy")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold">{formatCurrency(item.finalAmount)}</span>
                    <Badge variant={statusVariant(item.status)} className="text-xs px-1.5 py-0">
                      {item.status || "—"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* View all links */}
        <div className="mt-3 flex items-center gap-4 pt-2 border-t border-border">
          <a href="/sales" className="flex items-center gap-1 text-xs text-primary hover:underline">
            View all sales <ArrowRight className="w-3 h-3" />
          </a>
          <a href="/purchases" className="flex items-center gap-1 text-xs text-primary hover:underline">
            View all purchases <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
