// types/purchase.ts

import type { number } from "zod";

export interface PurchaseItem {
  id: number;
  productId: number;
  productCode: string;
  description: string;
  rate: number;
  aQty: number; // Added: A. Qty
  mQty: number; // Added: M. Qty
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
    // gstin: string;
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

export interface Batch {
  batchNo: string;
  mfgDate: string;
  expDate: string;
  barcode: string;
  currentStock: number;
  tempStock: number;
  mrp: number;
  pRate: number;
  lastPRate: number;
  pack: number;
}

export interface PurchaseHistory {
  batch: string;
  invoiceNo: string;
  date: string;
  quantity: number;
  rate: number;
  amount: number;
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
    aQty: number; // Added: A. Qty
    mQty: number; // Added: M. Qty
    totalAmount: number;
    taxRate: number;
    taxAmount: number;
    sch1Percent: number;
    sch1Amount: number;
    sch2Percent: number;
    sch2Amount: number;
    conversionFactor: number;
    cartonPack: number;
    productBrand:string;
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
