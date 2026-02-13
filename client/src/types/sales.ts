// ========== API Response Wrappers ==========
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  sales: T[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface SalesFilters {
  search?: string;
  invoiceNo?: string;
  customerId?: string | number;
  areaId?: string | number;
  vanId?: string | number;
  salesmanId?: string | number;
  fromDate?: Date; // replaced single invoiceDate
  toDate?: Date;
  minAmount?: number | string;
  maxAmount?: number | string;
  status?:
    | "all"
    | "Pending"
    | "Paid"
    | "Partially Paid"
    | "Cancelled"
    | "Delivered";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  showDeleted?: boolean;
}

export interface SalesFormData {
  invoiceDate: string;
  areaId: number;
  customerId: number;
  vanId: number;
  salesmanId: number;
  address: string;
  // invoiceNo removed – backend generates it
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
    cartonPack?: number;
    conversionFactor?: number;
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
}

// ========== Core Types ==========
export interface SalesItem {
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
}

export interface Sales {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  area: {
    id: number;
    name: string;
  };
  customer: {
    id: number;
    companyName: string | null;
    personName: string | null;
    phoneNo: string | null;
  };
  van: {
    id: number;
    name: string;
    vehicleNo: string | null;
  };
  salesman: {
    id: number;
    name: string;
    phoneNo: string | null;
  };
  address: string;
  gstDetails: string;
  items: SalesItem[];
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
  status: "Pending" | "Paid" | "Partially Paid" | "Cancelled" | "Delivered";
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}
