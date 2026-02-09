// types/purchase.ts

export interface PurchaseItem {
  id: number;
  productId: number;
  productCode: string;
  description: string;
  rate: number;
  expiryDate: string | null;
  manufacturingDate: string | null;
  totalAmount: number;
  taxRate: number;
  taxAmount: number;
  sch1Percent: number;
  sch1Amount: number;
  sch2Percent: number;
  sch2Amount: number;
}

export interface Purchase {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  supplier: {
    id: number;
    name: string;
    gstin: string;
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
  gstin: string;
}

export interface Product {
  id: number;
  productCode: string;
  description: string;
  price: number;
  gstRate: number;
}

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
    expiryDate: string | null;
    manufacturingDate: string | null;
    totalAmount: number;
    taxRate: number;
    taxAmount: number;
    sch1Percent: number;
    sch1Amount: number;
    sch2Percent: number;
    sch2Amount: number;
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
