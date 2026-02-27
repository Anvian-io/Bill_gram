// ========== API Response Wrappers ==========
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  purchases: T[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ========== Filters ==========
export interface PurchaseFilters {
  search?: string;
  // invoiceNo is removed – auto-generated
  supplierId?: string | number;
  fromDate?: Date; // ← only Date, never string
  toDate?: Date;
  minAmount?: number | string;
  maxAmount?: number | string;
  status?: "all" | "Pending" | "Paid" | "Partially Paid" | "Cancelled";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  showDeleted?: boolean;
}

// ========== Core Types ==========
export interface PurchaseItem {
  id: number;
  productId: number;
  productCode: string;
  description: string;
  rate: number;
  aQty: number;
  mQty: number;
  unit: number;
  fQty: number; // added
  DQty: number; // added
  totalAmount: number;
  taxRate: number;
  taxAmount: number;
  schPercent: number; // replaces sch1Percent/sch2Percent
  schAmount: number; // replaces sch1Amount/sch2Amount
  finalAmount: number;
  batchId?: number;
  cartonPack?: number;
  conversionFactor?: number;
  productBrand?: string;
}

export interface Purchase {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  supplier: {
    id: number;
    name: string;
    phoneNo?: string;
  };
  gstDetails: string;
  items: PurchaseItem[];
  remarks: string;
  grossAmount: number;
  boxUnit: number;
  cessInsurance: number;
  scheme1: number;
  discountPercent: number;
  tax: number;
  amountAdd: number;
  creditAmount: number;
  finalAmount: number;
  status: "Pending" | "Paid" | "Partially Paid" | "Cancelled";
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  gstin?: string;
  phoneNo?: string;
  email?: string;
  address?: string;
}

export interface Batch {
  id: number;
  batchNo: string;
  mfgDate: string;
  expDate: string;
  barcode: string;
  openingStock: number;
  mrp: number;
  purchaseRate: number;
  saleRate: number;
  margin: number;
  gstAmount: number;
  productId: number;
}

// ========== Form Data ==========
export type PurchaseFormData = {
  invoiceDate: string;
  supplierId: number;
  gstDetails: string; // invoiceNo removed – auto-generated
  items: Array<{
    schAmount: number;
    schPercent: any;
    fQty: string | number | readonly string[] | undefined;
    DQty: string | number | readonly string[] | undefined;
    finalAmount: number;
    productId: number;
    productCode: string;
    description: string;
    rate: number;
    aQty: number;
    mQty: number;
    unit: number;
    totalAmount: number;
    taxRate: number;
    taxAmount: number;
    sch1Percent: number;
    sch1Amount: number;
    sch2Percent: number;
    sch2Amount: number;
    batchId?: number;
    cartonPack: number;
    conversionFactor: number;
    productBrand: string;
  }>;
  remarks: string;
  grossAmount: number;
  boxUnit: number;
  cessInsurance: number;
  discountPercent: number;
  tax: number;
  amountAdd: number;
  creditAmount: number;
  finalAmount: number;
};

// ========== NEW: Purchase Report Types ==========
export interface PurchaseReportItem {
  id: number;
  invoiceNo: string;
  invoiceDate: string; // ISO string
  supplier: {
    id: number;
    name: string;
    phoneNo?: string;
    email?: string;
    address?: string;
  };
  totalAmount: number; // Sum of filtered items (or invoice finalAmount)
}

// Optional: if you want a dedicated type for report filters
export interface PurchaseReportFilters {
  fromDate?: Date;
  toDate?: Date;
  invoiceNo?: string;
  supplierId?: number | undefined;
  productGroupId?: number | undefined;
}

// Add/update these interfaces

export interface PurchaseSummaryProduct {
  productCode: string;
  description: string;
  totalUnit: number;
  purchaseRate: number; // average rate
  mrp: number; // average MRP
  totalUnitsPurchased: number; // sum of aQty
  totalMqty: number; // sum of mQty (boxes)
  fQty: number; // free quantity
  dQty: number; // damaged quantity
  finalAmount: number; // sum of item finalAmount
}

export interface PurchaseSummaryReportData {
  filters: {
    fromDate: string | null;
    toDate: string | null;
    invoiceNo: string | null;
    supplierId: number | null;
    productGroupId: number | null;
    page: number;
    limit: number;
  };
  dateRange: {
    // <-- NEW: actual min/max invoice dates from the data
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
  products: PurchaseSummaryProduct[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totals: {
    // new field
    totalMqty: number;
    totalUnit: number;
    totalUnitsPurchased: number;
    fQty: number;
    rep: number;
    dQty: number;
    finalAmount: number;
  };
}

// ========== Purchase Register Types ==========
export interface PurchaseRegisterInvoice {
  invoiceNo: string;
  invoiceDate: string; // ISO string
  supplierName: string;
  amount: number;
  cash: string; // always empty string
  cheque: string; // always empty string
  balance: number; // same as amount
}

export interface PurchaseRegisterData {
  filters: {
    fromDate: string | null;
    toDate: string | null;
    invoiceNo: string | null;
    supplierId: number | null;
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
  invoices: PurchaseRegisterInvoice[];
  totals: {
    totalAmount: number;
    totalInvoices: number;
  };
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ========== Purchase Report History Types ==========
export interface PurchaseReportHistory {
  id: number;
  userId: number;
  type: 'pdf' | 'excel';
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

export interface PurchaseReportHistoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  fileName?: string;
  type?: 'pdf' | 'excel' | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedHistoryResponse {
  histories: PurchaseReportHistory[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}