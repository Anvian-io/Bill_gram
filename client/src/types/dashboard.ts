// ========== Dashboard Types ==========

export interface DashboardKPIs {
  totalSalesAmount: number;
  totalPurchaseAmount: number;
  netRevenue: number;
  totalSalesInvoices: number;
  totalPurchaseInvoices: number;
  pendingSalesInvoices: number;
  totalCustomers: number;
  totalProducts: number;
  totalSuppliers: number;
}

export interface MonthlyTrendItem {
  month: string;
  salesQty: number;
  purchaseQty: number;
  salesAmount: number;
  purchaseAmount: number;
}

export interface InventoryGroupItem {
  name: string;
  totalStock: number;
  productCount: number;
}

export interface TopCustomerItem {
  id: number;
  name: string;
  totalAmount: number;
  totalQty: number;
  invoiceCount: number;
}

export interface TopProductItem {
  id: number;
  name: string;
  productCode: string;
  totalQty: number;
  totalAmount: number;
}

export interface SalesmanPerformanceItem {
  id: number;
  name: string;
  totalAmount: number;
  invoiceCount: number;
}

export interface SalesStatusItem {
  status: string;
  count: number;
  totalAmount: number;
}

export interface RecentActivityItem {
  id: number;
  invoiceNo: string | null;
  invoiceDate: string;
  finalAmount: number;
  status: string | null;
  createdAt: string;
  type: "sale" | "purchase";
  partyName: string;
}

export interface RecentActivity {
  recentSales: RecentActivityItem[];
  recentPurchases: RecentActivityItem[];
}

export interface DashboardData {
  kpis: DashboardKPIs | null;
  monthlyTrend: MonthlyTrendItem[];
  inventory: InventoryGroupItem[];
  topCustomers: TopCustomerItem[];
  topProducts: TopProductItem[];
  salesmanPerformance: SalesmanPerformanceItem[];
  salesStatusDistribution: SalesStatusItem[];
  recentActivity: RecentActivity | null;
}
