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
