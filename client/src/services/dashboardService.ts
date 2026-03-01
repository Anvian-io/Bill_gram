import { apiClient } from "../api/api-client";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";
import type {
  DashboardKPIs,
  MonthlyTrendItem,
  InventoryGroupItem,
  TopCustomerItem,
  TopProductItem,
  SalesmanPerformanceItem,
  SalesStatusItem,
  RecentActivity,
} from "@/types/dashboard";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export const dashboardService = {
  async getKPIs(year?: number): Promise<DashboardKPIs> {
    try {
      const params = year ? `?year=${year}` : "";
      const response = await apiClient.get<ApiResponse<DashboardKPIs>>(
        `/dashboard/kpis${params}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching dashboard KPIs:", message);
      throw new Error(message);
    }
  },

  async getMonthlyTrend(year?: number): Promise<MonthlyTrendItem[]> {
    try {
      const params = year ? `?year=${year}` : "";
      const response = await apiClient.get<ApiResponse<{ trend: MonthlyTrendItem[] }>>(
        `/dashboard/monthly-trend${params}`,
      );
      return response.data.data.trend || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching monthly trend:", message);
      throw new Error(message);
    }
  },

  async getInventorySummary(): Promise<InventoryGroupItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ inventory: InventoryGroupItem[] }>>(
        `/dashboard/inventory-summary`,
      );
      return response.data.data.inventory || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching inventory summary:", message);
      throw new Error(message);
    }
  },

  async getTopCustomers(year?: number): Promise<TopCustomerItem[]> {
    try {
      const params = year ? `?year=${year}` : "";
      const response = await apiClient.get<ApiResponse<{ topCustomers: TopCustomerItem[] }>>(
        `/dashboard/top-customers${params}`,
      );
      return response.data.data.topCustomers || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching top customers:", message);
      throw new Error(message);
    }
  },

  async getTopProducts(year?: number): Promise<TopProductItem[]> {
    try {
      const params = year ? `?year=${year}` : "";
      const response = await apiClient.get<ApiResponse<{ topProducts: TopProductItem[] }>>(
        `/dashboard/top-products${params}`,
      );
      return response.data.data.topProducts || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching top products:", message);
      throw new Error(message);
    }
  },

  async getSalesmanPerformance(year?: number): Promise<SalesmanPerformanceItem[]> {
    try {
      const params = year ? `?year=${year}` : "";
      const response = await apiClient.get<ApiResponse<{ performance: SalesmanPerformanceItem[] }>>(
        `/dashboard/salesman-performance${params}`,
      );
      return response.data.data.performance || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching salesman performance:", message);
      throw new Error(message);
    }
  },

  async getSalesStatusDistribution(year?: number): Promise<SalesStatusItem[]> {
    try {
      const params = year ? `?year=${year}` : "";
      const response = await apiClient.get<ApiResponse<{ distribution: SalesStatusItem[] }>>(
        `/dashboard/sales-status-distribution${params}`,
      );
      return response.data.data.distribution || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching sales status distribution:", message);
      throw new Error(message);
    }
  },

  async getRecentActivity(): Promise<RecentActivity> {
    try {
      const response = await apiClient.get<ApiResponse<RecentActivity>>(
        `/dashboard/recent-activity`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching recent activity:", message);
      throw new Error(message);
    }
  },
};
