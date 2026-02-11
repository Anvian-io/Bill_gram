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
  invoiceNo?: string;
  supplierId?: string | number;
  fromDate?: Date | string;
  toDate?: Date | string;
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
  totalAmount: number;
  taxRate: number;
  taxAmount: number;
  sch1Percent: number;
  sch1Amount: number;
  sch2Percent: number;
  sch2Amount: number;
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
  invoiceNo: string;
  gstDetails: string;
  items: Array<{
    productId: number;
    productCode: string;
    description: string;
    rate: number;
    aQty: number;
    mQty: number;
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
  scheme1: number;
  discountPercent: number;
  tax: number;
  amountAdd: number;
  creditAmount: number;
  finalAmount: number;
};
