import type { PurchaseReportFilters } from "@/types/purchase";
import type { SalesReportFilters } from "@/types/sales-report";

export function appendSelectedIdsParam(
  params: URLSearchParams,
  selectedIds?: number[],
) {
  if (selectedIds && selectedIds.length > 0) {
    params.append("selectedIds", selectedIds.join(","));
  }
}

export function appendPurchaseReportFilters(
  params: URLSearchParams,
  filters?: PurchaseReportFilters,
) {
  if (!filters) return;

  if (filters.fromDate) {
    params.append("fromDate", filters.fromDate.toISOString());
  }
  if (filters.toDate) {
    params.append("toDate", filters.toDate.toISOString());
  }
  if (filters.invoiceNo) {
    params.append("invoiceNo", filters.invoiceNo);
  }
  if (filters.supplierId) {
    params.append("supplierId", filters.supplierId.toString());
  }
  if (
    filters.gstDetails !== undefined &&
    filters.gstDetails !== "" &&
    filters.gstDetails !== "all"
  ) {
    params.append("gstDetails", filters.gstDetails);
  }
  if (filters.productGroupId) {
    params.append("productGroupId", filters.productGroupId.toString());
  }
  appendSelectedIdsParam(params, filters.selectedIds);
}

export function appendSalesReportFilters(
  params: URLSearchParams,
  filters?: SalesReportFilters,
) {
  if (!filters) return;

  if (filters.fromDate) {
    params.append("fromDate", filters.fromDate.toISOString());
  }
  if (filters.toDate) {
    params.append("toDate", filters.toDate.toISOString());
  }
  if (filters.invoiceNo) {
    params.append("invoiceNo", filters.invoiceNo);
  }
  if (filters.customerId) {
    params.append("customerId", filters.customerId.toString());
  }
  if (filters.areaId) {
    params.append("areaId", filters.areaId.toString());
  }
  if (filters.vanId) {
    params.append("vanId", filters.vanId.toString());
  }
  if (filters.salesmanId) {
    params.append("salesmanId", filters.salesmanId.toString());
  }
  if (
    filters.gstDetails !== undefined &&
    filters.gstDetails !== "" &&
    filters.gstDetails !== "all"
  ) {
    params.append("gstDetails", filters.gstDetails);
  }
  if (filters.productGroupId) {
    params.append("productGroupId", filters.productGroupId.toString());
  }
  if (filters.summaryType) {
    params.append("summaryType", filters.summaryType);
  }
  appendSelectedIdsParam(params, filters.selectedIds);
}
