// types/sales-report.ts

export interface SalesReportFilters {
  fromDate?: Date;
  toDate?: Date;
  invoiceNo?: string;
  customerId?: number;
  areaId?: number;
  vanId?: number;
  salesmanId?: number;
  productGroupId?: number;
}

// For SalesSummary (invoice level)
export interface SalesReportItem {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  totalAmount: number;
  customer: {
    id: number;
    companyName?: string;
    personName?: string;
    phoneNo?: string;
  };
}

// For AreaWise (group level with nested invoices)
export interface AreaWiseReportItem {
  areaId: number;
  areaName: string;
  totalAmount: number;
  invoices: AreaWiseInvoiceDetail[];
}

export interface AreaWiseInvoiceDetail {
  invoiceNo: string;
  invoiceDate: Date;
  totalAmount: number;
  customerName: string;
}

// For SalesmanWise (group level with nested invoices)
export interface SalesmanWiseReportItem {
  salesmanId: number;
  salesmanName: string;
  totalAmount: number;
  invoices: SalesmanWiseInvoiceDetail[];
}

export interface SalesmanWiseInvoiceDetail {
  invoiceNo: string;
  invoiceDate: Date;
  totalAmount: number;
  customerName: string;
}

// NEW: Area Wise PDF Data types
export interface AreaWisePDFDataItem {
  areaId: number;
  areaName: string;
  totalDiscount: number;
  totalSchemeAmount: number;
  totalGST: number;
  finalAmount: number;
  invoiceCount: number;
}

export interface AreaWisePDFGrandTotals {
  totalDiscount: number;
  totalSchemeAmount: number;
  totalGST: number;
  finalAmount: number;
  invoiceCount: number;
}

export interface AreaWisePDFData {
  filters: {
    fromDate: string | null;
    toDate: string | null;
    invoiceNo: string | null;
    customerId: number | null;
    vanId: number | null;
    salesmanId: number | null;
    productGroupId: number | null;
    page: number;
    limit: number;
  };
  dateRange: {
    from: string | null;
    to: string | null;
  };
  user: {
    shop_name: string | null;
  };
  invoiceRange: {
    start: string | null;
    end: string | null;
  };
  areas: string[];
  areaData: AreaWisePDFDataItem[];
  grandTotals: AreaWisePDFGrandTotals;
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// NEW: Salesman Wise PDF Data types
export interface SalesmanWisePDFDataItem {
  salesmanId: number;
  salesmanName: string;
  totalDiscount: number;
  totalSchemeAmount: number;
  totalGST: number;
  finalAmount: number;
  invoiceCount: number;
}

export interface SalesmanWisePDFGrandTotals {
  totalDiscount: number;
  totalSchemeAmount: number;
  totalGST: number;
  finalAmount: number;
  invoiceCount: number;
}

export interface SalesmanWisePDFData {
  filters: {
    fromDate: string | null;
    toDate: string | null;
    invoiceNo: string | null;
    customerId: number | null;
    areaId: number | null;
    vanId: number | null;
    productGroupId: number | null;
    page: number;
    limit: number;
  };
  dateRange: {
    from: string | null;
    to: string | null;
  };
  user: {
    shop_name: string | null;
  };
  invoiceRange: {
    start: string | null;
    end: string | null;
  };
  areas: string[];
  salesmanData: SalesmanWisePDFDataItem[];
  grandTotals: SalesmanWisePDFGrandTotals;
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// NEW: Sales Summary Report Data (for modal preview)
export interface SalesSummaryProduct {
  productCode: string;
  description: string;
  totalUnit: number;
  saleRate: number;
  mrp: number;
  totalUnitsSold: number;
  totalMqty: number;
  fQty: number;
  dQty: number;
  finalAmount: number;
}

export interface SalesSummaryTotals {
  totalMqty: number;
  totalUnit: number;
  totalUnitsSold: number;
  fQty: number;
  rep: number;
  dQty: number;
  finalAmount: number;
}

export interface SalesSummaryPagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SalesSummaryReportData {
  filters: {
    fromDate: string | null;
    toDate: string | null;
    invoiceNo: string | null;
    customerId: number | null;
    areaId: number | null;
    vanId: number | null;
    salesmanId: number | null;
    productGroupId: number | null;
    page: number;
    limit: number;
  };
  dateRange: {
    from: string | null;
    to: string | null;
  };
  user: {
    shop_name: string | null;
  };
  invoiceRange: {
    start: string | null;
    end: string | null;
  };
  areas: string[];
  products: SalesSummaryProduct[];
  totals: SalesSummaryTotals;
  pagination: SalesSummaryPagination;
}

// NEW: Sales Register Report Data (for modal preview)
export interface SalesRegisterInvoice {
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  amount: number;
  cash: string; // empty for now
  cheque: string; // empty for now
  balance: number; // same as amount
}

export interface SalesRegisterPagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SalesRegisterReportData {
  filters: {
    fromDate: string | null;
    toDate: string | null;
    invoiceNo: string | null;
    customerId: number | null;
    areaId: number | null;
    vanId: number | null;
    salesmanId: number | null;
    page: number;
    limit: number;
  };
  dateRange: {
    from: string | null;
    to: string | null;
  };
  user: {
    shop_name: string | null;
  };
  invoiceRange: {
    start: string | null;
    end: string | null;
  };
  areas: string[];
  invoices: SalesRegisterInvoice[];
  totals: {
    totalAmount: number;
    totalInvoices: number;
  };
  pagination: SalesRegisterPagination;
}

// For SalesGST (detailed invoice view)
export interface SalesGSTItem {
  itemId: number;
  productId: number;
  productCode?: string;
  description?: string;
  hsnSacCode?: string;
  gstRate: number;
  cessRate: number;
  unitName?: string;
  unitSymbol?: string;
  quantity: number;
  unit: string;
  rate: number;
  mrp?: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalGST: number;
  schemeAmount: number;
  schemePercent: number;
  freeQuantity: number;
  damagedQuantity: number;
  finalAmount: number;
}

export interface SalesGSTInvoice {
  saleId: number;
  invoiceId: string;
  customerName: string;
  gstin: string;
  invoiceDate: string;
  refInvoiceId: string;
  refDate: string | null;
  grossAmount: number;
  schemeAmount: number;
  discountAmount: number;
  damageAmount: number;
  finalAmount: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalGSTAmount: number;
  cess: number;
  addAmount: number;
  creditAmount: number;
  boxUnit: number;
  remarks: string;
  status: string;
  customerDetails?: {
    id: number;
    companyName?: string;
    personName?: string;
    phoneNo?: string;
    email?: string;
    address?: string;
  };
  areaDetails?: {
    id: number;
    name: string;
  };
  vanDetails?: {
    id: number;
    name: string;
    vehicleNo?: string;
  };
  salesmanDetails?: {
    id: number;
    name: string;
    phoneNo?: string;
  };
  userDetails?: {
    shopName?: string;
    companyName?: string;
  };
  items: SalesGSTItem[];
  itemCount: number;
}

export interface SalesGSTSummary {
  totalRecords: number;
  totalGrossAmount: number;
  totalSchemeAmount: number;
  totalDiscountAmount: number;
  totalDamageAmount: number;
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalCess: number;
  totalFinalAmount: number;
}

export interface SalesGSTPagination {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SalesGSTResponse {
  sales: SalesGSTInvoice[];
  summary: SalesGSTSummary;
  pagination: SalesGSTPagination;
}

export interface SalesGSTFilters {
  customerId?: number;
  fromDate?: Date;
  toDate?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// For SalesMonthlyGST (aggregated monthly view)
export interface SalesMonthlyData {
  monthKey: string; // Format: "YYYY-MM"
  invoiceCount: number;
  totalGrossAmount: number;
  totalSchemeAmount: number;
  totalDiscountAmount: number;
  totalDamageAmount: number;
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalCess: number;
  totalGSTAmount: number;
  totalCessCharge: number;
  totalAddAmount: number;
  totalCreditAmount: number;
  totalFinalAmount: number;
}

export interface SalesMonthlyGrandTotals {
  totalGrossAmount: number;
  totalSchemeAmount: number;
  totalDiscountAmount: number;
  totalDamageAmount: number;
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalCess: number;
  totalGSTAmount: number;
  totalCessCharge: number;
  totalAddAmount: number;
  totalCreditAmount: number;
  totalFinalAmount: number;
  totalInvoices: number;
}

export interface SalesMonthlyPeriod {
  from: string;
  to: string;
  totalMonths: number;
}

export interface SalesMonthlyGSTResponse {
  filters: {
    fromDate: string;
    toDate: string;
  };
  period: SalesMonthlyPeriod;
  monthlyData: SalesMonthlyData[];
  grandTotals: SalesMonthlyGrandTotals;
}

export interface SalesMonthlyFilters {
  fromDate?: Date;
  toDate?: Date;
}

// ========== Sales Report History Types ==========
export interface SalesReportHistory {
  id: number;
  userId: number;
  type: "pdf" | "excel";
  tab: "summary" | "register" | "area-wise" | "salesman-wise";
  template: string;
  fileName: string | null;
  data: string; // JSON string of the report data
  createdAt: string;
  user?: {
    id: number;
    username: string;
    shop_name: string | null;
  };
}

export interface SalesReportHistoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  fileName?: string;
  type?: "pdf" | "excel" | "";
  tab?: "summary" | "register" | "area-wise" | "salesman-wise" | "";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedSalesHistoryResponse {
  histories: SalesReportHistory[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}