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
    name: string;
    code: string;
  };
  van: {
    id: number;
    name: string;
    number: string;
  };
  salesman: {
    id: number;
    name: string;
    code: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Area {
  id: number;
  name: string;
  code: string;
}

export interface Customer {
  id: number;
  name: string;
  code: string;
  address: string;
  areaId: number;
}

export interface Van {
  id: number;
  name: string;
  number: string;
  driverName: string;
}

export interface Salesman {
  id: number;
  name: string;
  code: string;
  areaId: number;
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
  sRate: number; // Sales rate (different from purchase rate)
  lastSRate: number;
  pack: number;
}

export interface SalesHistory {
  batch: string;
  invoiceNo: string;
  date: string;
  quantity: number;
  rate: number;
  amount: number;
  customer: string;
}

export type SalesFormData = {
  invoiceDate: string;
  areaId: number;
  customerId: number;
  vanId: number;
  salesmanId: number;
  address: string;
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
