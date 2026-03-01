import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dashboardService } from "@/services/dashboardService";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { InventoryChart } from "@/components/dashboard/InventoryChart";
import { TopCustomersChart } from "@/components/dashboard/TopCustomersChart";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { SalesmanChart } from "@/components/dashboard/SalesmanChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import type { DashboardData } from "@/types/dashboard";

const currentYear = new Date().getFullYear();
// const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const defaultData: DashboardData = {
  kpis: null,
  monthlyTrend: [],
  inventory: [],
  topCustomers: [],
  topProducts: [],
  salesmanPerformance: [],
  salesStatusDistribution: [],
  recentActivity: null,
};

interface LoadingState {
  kpis: boolean;
  monthlyTrend: boolean;
  inventory: boolean;
  topCustomers: boolean;
  topProducts: boolean;
  salesmanPerformance: boolean;
  salesStatusDistribution: boolean;
  recentActivity: boolean;
}

const allLoading = (): LoadingState => ({
  kpis: true,
  monthlyTrend: true,
  inventory: true,
  topCustomers: true,
  topProducts: true,
  salesmanPerformance: true,
  salesStatusDistribution: true,
  recentActivity: true,
});

function Dashboard() {
  const [year, setYear] = useState<number>(currentYear);
  const [data, setData] = useState<DashboardData>(defaultData);
  const [loading, setLoading] = useState<LoadingState>(allLoading());
  const [refreshKey, setRefreshKey] = useState(0);

  const setPartialLoading = (key: keyof LoadingState, value: boolean) =>
    setLoading((prev) => ({ ...prev, [key]: value }));

  const fetchAll = useCallback(async (selectedYear: number) => {
    setLoading(allLoading());
    setData(defaultData);

    const runSafe = async <T,>(
      key: keyof LoadingState,
      fn: () => Promise<T>,
      setter: (v: T) => void,
    ) => {
      try {
        const result = await fn();
        setter(result);
      } catch (e) {
        console.error(`Dashboard fetch error [${key}]:`, e);
      } finally {
        setPartialLoading(key, false);
      }
    };

    // Year-dependent fetches (in parallel)
    runSafe("kpis", () => dashboardService.getKPIs(selectedYear), (v) =>
      setData((d) => ({ ...d, kpis: v })));

    runSafe("monthlyTrend", () => dashboardService.getMonthlyTrend(selectedYear), (v) =>
      setData((d) => ({ ...d, monthlyTrend: v })));

    runSafe("topCustomers", () => dashboardService.getTopCustomers(selectedYear), (v) =>
      setData((d) => ({ ...d, topCustomers: v })));

    runSafe("topProducts", () => dashboardService.getTopProducts(selectedYear), (v) =>
      setData((d) => ({ ...d, topProducts: v })));

    runSafe("salesmanPerformance", () => dashboardService.getSalesmanPerformance(selectedYear), (v) =>
      setData((d) => ({ ...d, salesmanPerformance: v })));

    runSafe("salesStatusDistribution", () => dashboardService.getSalesStatusDistribution(selectedYear), (v) =>
      setData((d) => ({ ...d, salesStatusDistribution: v })));

    // Static fetches (no year filter)
    runSafe("inventory", () => dashboardService.getInventorySummary(), (v) =>
      setData((d) => ({ ...d, inventory: v })));

    runSafe("recentActivity", () => dashboardService.getRecentActivity(), (v) =>
      setData((d) => ({ ...d, recentActivity: v })));
  }, []);

  useEffect(() => {
    fetchAll(year);
  }, [year, refreshKey, fetchAll]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Business overview for {year}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* <Select
            value={year.toString()}
            onValueChange={(v) => setYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={Object.values(loading).some(Boolean)}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${Object.values(loading).some(Boolean) ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      {/* <section>
        <KpiCards data={data.kpis} loading={loading.kpis} />
      </section> */}

      {/* Inventory + Status Pie */}
      <section className="">
        {/* <div className="lg:col-span-2"> */}
        <InventoryChart data={data.inventory} loading={loading.inventory} />
        {/* </div> */}
      </section>

      {/* Monthly Trend (full width) */}
      <section>
        <MonthlyTrendChart
          data={data.monthlyTrend}
          loading={loading.monthlyTrend}
        />
      </section>

      {/* Top Customers + Top Products */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopCustomersChart
          data={data.topCustomers}
          loading={loading.topCustomers}
        />
        <TopProductsChart
          data={data.topProducts}
          loading={loading.topProducts}
        />
      </section>

      {/* Salesman Performance + Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <SalesmanChart
            data={data.salesmanPerformance}
            loading={loading.salesmanPerformance}
          />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity
            data={data.recentActivity}
            loading={loading.recentActivity}
          />
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
