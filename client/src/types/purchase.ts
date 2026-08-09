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
  gstDetails?: string;
  fromDate?: Date; // ← only Date, never string
  toDate?: Date;
  minAmount?: number | string;
  maxAmount?: number | string;
  status?: "all" | "Pending" | "Paid" | "Partially Paid" | "Cancelled" | "Return";
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
  status: "Pending" | "Paid" | "Partially Paid" | "Cancelled" | "Return";
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseBillPreviewData {
  purchase: Purchase & {
    supplier: {
      id: number;
      name: string;
      phoneNo?: string | null;
      email?: string | null;
      address?: string | null;
      gstIN?: string | null;
    };
    user: {
      id: number;
      username: string;
      company_name: string | null;
      shop_name?: string | null;
      phone: string | null;
      email: string | null;
      upi_id: string | null;
      signature: string | null;
      company_logo: string | null;
      address: string | null;
    } | null;
    items: Array<
      PurchaseItem & {
        product?: {
          hsnSacCode?: string | null;
          description?: string | null;
        };
        batch?: {
          mrp?: number | null;
          purchaseRate?: number | null;
        };
      }
    >;
  };
  taxBreakdown?: Array<{
    rate: number;
    cgstAmount: number;
    sgstAmount: number;
    totalTaxAmount: number;
  }>;
  upiQrCode: string | null;
  signature: string | null;
  companyLogo: string | null;
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
    schPercent: number;
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
  gstDetails?: string;
  productGroupId?: number | undefined;
  selectedIds?: number[];
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
    gstDetails: string | null;
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
    gstDetails: string | null;
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
  type: "pdf" | "excel";
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
  type?: "pdf" | "excel" | "";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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

// ========== Purchase GST Types ==========
export interface PurchaseGSTItem {
  itemId: number;
  productId: number;
  productCode: string | null;
  description: string | null;
  hsnSacCode: string | null;
  gstRate: number;
  cessRate: number;
  quantity: number;
  unit: number;
  rate: number;
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

export interface PurchaseGSTInvoice {
  purchaseId: number;
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
  supplierDetails: {
    id: number;
    name: string;
    phoneNo: string | null;
    email: string | null;
    address: string | null;
  } | null;
  userDetails: {
    shopName: string | null;
    companyName: string | null;
  };
  items: PurchaseGSTItem[];
  itemCount: number;
}

export interface PurchaseGSTSummary {
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

export interface PurchaseGSTResponse {
  purchases: PurchaseGSTInvoice[];
  summary: PurchaseGSTSummary;
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PurchaseGSTFilters {
  supplierId?: number;
  gstDetails?: string;
  fromDate?: Date;
  toDate?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  selectedIds?: number[];
  page?: number;
  limit?: number;
}

export interface PurchaseB2BRow {
  id: string;
  party: string;
  gstinNumber: string;
  invoiceNo: string;
  invoiceDate: string;
  place: string;
  invoiceType: string;
  finalAmount: number;
  rate: number;
  taxable: number;
  taxValue: number;
  cess: number;
  addCess: number;
  apmc: number;
}

export interface PurchaseB2BFilters {
  supplierId?: number;
  gstDetails?: string;
  fromDate?: Date;
  toDate?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PurchaseB2BResponse {
  rows: PurchaseB2BRow[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PurchaseMonthlyData {
  cessAmount: number;
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

export interface PurchaseMonthlyGrandTotals {
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

export interface PurchaseMonthlyGSTResponse {
  filters: {
    fromDate: string;
    toDate: string;
    gstDetails: string | null;
  };
  period: {
    from: string;
    to: string;
    totalMonths: number;
  };
  monthlyData: PurchaseMonthlyData[];
  grandTotals: PurchaseMonthlyGrandTotals;
}

export interface PurchaseMonthlyFilters {
  fromDate?: Date;
  toDate?: Date;
  gstDetails?: string;
}
