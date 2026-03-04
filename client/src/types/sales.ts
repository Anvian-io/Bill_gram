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
  fromDate?: Date;
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
  gstDetails: string;
  phoneNo?: string; // ADDED: UI-only field for phone search
  items: Array<{
    productId: number;
    productCode: string;
    description: string;
    rate: number;
    aQty: number;
    mQty: number;
    unit: number;
    fQty: number;
    DQty: number;
    totalAmount: number;
    finalAmount: number;
    taxRate: number;
    taxAmount: number;
    schPercent: number;
    schAmount: number;
    batchId?: number;
    batchOpeningStock?: number;
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
  unit: number;
  fQty: number;
  DQty: number;
  totalAmount: number;
  finalAmount: number;
  taxRate: number;
  taxAmount: number;
  schPercent: number;
  schAmount: number;
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
    address: string;
    gstIN: string;
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

export interface SalesBillPreviewData {
  sale: Sales & {
    user: {
      id: number;
      username: string;
      company_name: string | null; // shop name
      shop_name?: string | null; // fallback
      phone: string | null;
      email: string | null;
      upi_id: string | null;
      signature: string | null; // URL or path
      company_logo: string | null; // URL or path
      address: string | null;
      gstin?: string; // not in schema but might be stored
      fssai?: string; // not in schema
    };
  };
  taxBreakdown?: Array<{
    rate: number;
    cgstAmount: number;
    sgstAmount: number;
    totalTaxAmount: number;
  }>;
  upiQrCode: string | null; // base64 PNG data URL
  signature: string | null; // duplicate for convenience
  companyLogo: string | null; // duplicate for convenience
}
