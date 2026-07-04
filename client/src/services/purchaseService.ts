import { apiClient } from "../api/api-client";
import type {
  Purchase,
  PurchaseFormData,
  PaginatedResponse,
  ApiResponse,
  PurchaseFilters,
  PurchaseReportFilters,
  PurchaseReportItem,
  PurchaseSummaryReportData,
  PurchaseRegisterData,
  PurchaseReportHistoryFilters,
  PaginatedHistoryResponse,
  PurchaseGSTFilters,
  PurchaseGSTResponse,
  PurchaseB2BFilters,
  PurchaseB2BResponse,
  PurchaseMonthlyFilters,
  PurchaseMonthlyGSTResponse,
  PurchaseBillPreviewData,
} from "@/types/purchase";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";
import { appendPurchaseReportFilters } from "@/lib/reportQueryParams";

const appendGstDetailsParam = (
  params: URLSearchParams,
  gstDetails?: string,
) => {
  if (gstDetails !== undefined && gstDetails !== "" && gstDetails !== "all") {
    params.append("gstDetails", gstDetails);
  }
};

export const purchaseService = {
  // Get all purchases with pagination & filters
  async getPurchases(
    page: number = 1,
    limit: number = 10,
    filters?: PurchaseFilters,
  ): Promise<PaginatedResponse<Purchase>> {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== "" && value !== "all") {
            if (key === "fromDate" || key === "toDate") {
              // send as ISO string
              params.append(key, new Date(value as string).toISOString());
            } else if (key === "showDeleted") {
              params.append(key, value ? "true" : "false");
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const response = await apiClient.get<
        ApiResponse<PaginatedResponse<Purchase>>
      >(`/purchases?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching purchases:", message);
      throw new Error(message);
    }
  },

  // Get single purchase by ID
  async getPurchase(id: number): Promise<Purchase> {
    try {
      const response = await apiClient.get<ApiResponse<{ purchase: Purchase }>>(
        `/purchases/${id}`,
      );
      return response.data.data.purchase;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching purchase:", message);
      throw new Error(message);
    }
  },

  // Create new purchase invoice
  async createPurchase(data: PurchaseFormData): Promise<Purchase> {
    try {
      const response = await apiClient.post<
        ApiResponse<{ purchase: Purchase }>
      >("/purchases", data);
      return response.data.data.purchase;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error creating purchase:", message);
      throw new Error(message);
    }
  },

  async createPurchaseReturn(data: PurchaseFormData): Promise<Purchase> {
    try {
      const response = await apiClient.post<
        ApiResponse<{ purchase: Purchase }>
      >("/purchases/returns", data);
      return response.data.data.purchase;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error creating purchase return:", message);
      throw new Error(message);
    }
  },

  async checkInvoiceNumber(
    invoiceNo: string,
  ): Promise<{ available: boolean; message: string }> {
    try {
      const params = new URLSearchParams();
      params.append("invoiceNo", invoiceNo);
      const response = await apiClient.get<
        ApiResponse<{ available: boolean }>
      >(`/purchases/check-invoice?${params.toString()}`);
      return {
        available: response.data.data.available,
        message: response.data.message,
      };
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error checking invoice number:", message);
      throw new Error(message);
    }
  },

  // Update purchase invoice
  async updatePurchase(id: number, data: PurchaseFormData): Promise<Purchase> {
    try {
      const response = await apiClient.put<ApiResponse<{ purchase: Purchase }>>(
        `/purchases/${id}`,
        data,
      );
      return response.data.data.purchase;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating purchase:", message);
      throw new Error(message);
    }
  },

  // Delete purchase (soft delete)
  async deletePurchase(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/purchases/${id}`);
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error deleting purchase:", message);
      throw new Error(message);
    }
  },

  // Get active purchases (for dropdowns)
  async getActivePurchases(): Promise<Purchase[]> {
    try {
      const response =
        await apiClient.get<ApiResponse<{ purchases: Purchase[] }>>(
          "/purchases/active",
        );
      return response.data.data.purchases || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching active purchases:", message);
      throw new Error(message);
    }
  },

  // ========== NEW: Purchase Report ==========
  async getPurchaseReport(
    filters?: PurchaseReportFilters,
  ): Promise<PurchaseReportItem[]> {
    try {
      const params = new URLSearchParams();
      appendPurchaseReportFilters(params, filters);

      const response = await apiClient.get<
        ApiResponse<{ report: PurchaseReportItem[] }>
      >(`/purchases/report?${params.toString()}`);
      return response.data.data.report;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching purchase report:", message);
      throw new Error(message);
    }
  },
  async getPurchaseSummaryReportPDFData(
    filters?: PurchaseReportFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<PurchaseSummaryReportData> {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      appendPurchaseReportFilters(params, filters);

      const response = await apiClient.get<
        ApiResponse<PurchaseSummaryReportData>
      >(`/purchases/summary-pdf-data?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching purchase summary:", message);
      throw new Error(message);
    }
  },

  // NEW: Download Purchase Summary PDF
  async downloadPurchaseSummaryPDF(
    filters?: PurchaseReportFilters,
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      appendPurchaseReportFilters(params, filters);

      const response = await apiClient.get<Blob>(
        `/purchases/purchase-summary-report/pdf?${params.toString()}`,
        { responseType: "blob" },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading purchase summary PDF:", message);
      throw new Error(message);
    }
  },
  async downloadPurchaseSummaryExcel(
    filters?: PurchaseReportFilters,
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      appendPurchaseReportFilters(params, filters);

      const response = await apiClient.get<Blob>(
        `/purchases/purchase-summary-report/excel?${params.toString()}`,
        { responseType: "blob" },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading purchase summary Excel:", message);
      throw new Error(message);
    }
  },

  // ========== Purchase Register ==========
  async getPurchaseRegisterPDFData(
    filters?: PurchaseReportFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<PurchaseRegisterData> {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      appendPurchaseReportFilters(params, filters);

      const response = await apiClient.get<ApiResponse<PurchaseRegisterData>>(
        `/purchases/register-pdf-data?${params.toString()}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching purchase register data:", message);
      throw new Error(message);
    }
  },

  async downloadPurchaseRegisterPDF(
    filters?: PurchaseReportFilters,
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      appendPurchaseReportFilters(params, filters);
      const response = await apiClient.get<Blob>(
        `/purchases/purchase-register-report/pdf?${params.toString()}`,
        { responseType: "blob" },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading purchase register PDF:", message);
      throw new Error(message);
    }
  },

  async downloadPurchaseRegisterExcel(
    filters?: PurchaseReportFilters,
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      appendPurchaseReportFilters(params, filters);
      const response = await apiClient.get<Blob>(
        `/purchases/purchase-register-report/excel?${params.toString()}`,
        { responseType: "blob" },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading purchase register Excel:", message);
      throw new Error(message);
    }
  },

  // ========== Purchase Report History ==========
  async getPurchaseReportHistory(
    filters?: PurchaseReportHistoryFilters,
  ): Promise<PaginatedHistoryResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.search) params.append("search", filters.search);
        if (filters.fileName) params.append("fileName", filters.fileName);
        if (filters.type) params.append("type", filters.type);
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      }

      const response = await apiClient.get<
        ApiResponse<PaginatedHistoryResponse>
      >(`/purchases/history/all?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching purchase report history:", message);
      throw new Error(message);
    }
  },

  async downloadPurchaseReportHistoryPDF(id: number): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(
        `/purchases/history/${id}/pdf`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading history PDF:", message);
      throw new Error(message);
    }
  },

  async downloadPurchaseReportHistoryExcel(id: number): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(
        `/purchases/history/${id}/excel`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading history Excel:", message);
      throw new Error(message);
    }
  },

  // ========== Purchase GST Report ==========
  async getPurchaseGST(
    filters?: PurchaseGSTFilters,
  ): Promise<PurchaseGSTResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.supplierId)
          params.append("supplierId", filters.supplierId.toString());
        appendGstDetailsParam(params, filters.gstDetails);
        if (filters.fromDate)
          params.append("fromDate", filters.fromDate.toISOString());
        if (filters.toDate)
          params.append("toDate", filters.toDate.toISOString());
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      }

      const response = await apiClient.get<ApiResponse<PurchaseGSTResponse>>(
        `/purchases/purchase-gst?${params.toString()}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching purchase GST data:", message);
      throw new Error(message);
    }
  },

  async downloadPurchaseGSTExcel(
    filters?: Omit<PurchaseGSTFilters, "page" | "limit">,
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.supplierId)
          params.append("supplierId", filters.supplierId.toString());
        appendGstDetailsParam(params, filters.gstDetails);
        if (filters.fromDate)
          params.append("fromDate", filters.fromDate.toISOString());
        if (filters.toDate)
          params.append("toDate", filters.toDate.toISOString());
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      }

      const response = await apiClient.get<Blob>(
        `/purchases/purchase-gst/excel?${params.toString()}`,
        { responseType: "blob" },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading purchase GST Excel:", message);
      throw new Error(message);
    }
  },

  // ========== Purchase B2B Report ==========
  async getPurchaseB2B(
    filters?: PurchaseB2BFilters,
  ): Promise<PurchaseB2BResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());
        if (filters.supplierId)
          params.append("supplierId", filters.supplierId.toString());
        appendGstDetailsParam(params, filters.gstDetails);
        if (filters.fromDate)
          params.append("fromDate", filters.fromDate.toISOString());
        if (filters.toDate)
          params.append("toDate", filters.toDate.toISOString());
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      }

      const response = await apiClient.get<ApiResponse<PurchaseB2BResponse>>(
        `/purchases/b2b?${params.toString()}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching purchase B2B data:", message);
      throw new Error(message);
    }
  },

  // Download GSTR2 Excel report
  async downloadGSTR2Excel(
    filters?: Omit<PurchaseGSTFilters, "page" | "limit">,
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.supplierId)
          params.append("supplierId", filters.supplierId.toString());
        appendGstDetailsParam(params, filters.gstDetails);
        if (filters.fromDate)
          params.append("fromDate", filters.fromDate.toISOString());
        if (filters.toDate)
          params.append("toDate", filters.toDate.toISOString());
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      }

      const response = await apiClient.get<Blob>(
        `/purchases/gstr2/excel?${params.toString()}`,
        { responseType: "blob" },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading GSTR2 Excel:", message);
      throw new Error(message);
    }
  },

  async downloadPurchaseB2BExcel(
    filters?: Omit<PurchaseB2BFilters, "page" | "limit">,
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.supplierId)
          params.append("supplierId", filters.supplierId.toString());
        appendGstDetailsParam(params, filters.gstDetails);
        if (filters.fromDate)
          params.append("fromDate", filters.fromDate.toISOString());
        if (filters.toDate)
          params.append("toDate", filters.toDate.toISOString());
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
      }

      const response = await apiClient.get<Blob>(
        `/purchases/b2b/excel?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading purchase B2B Excel:", message);
      throw new Error(message);
    }
  },

  // ========== Purchase Monthly GST Report ==========
  async getPurchaseGSTMonthly(
    filters?: PurchaseMonthlyFilters,
  ): Promise<PurchaseMonthlyGSTResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        if (filters.fromDate)
          params.append("fromDate", filters.fromDate.toISOString());
        if (filters.toDate)
          params.append("toDate", filters.toDate.toISOString());
        appendGstDetailsParam(params, filters.gstDetails);
      }

      const response = await apiClient.get<
        ApiResponse<PurchaseMonthlyGSTResponse>
      >(`/purchases/purchase-gst-monthly?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching monthly GST data:", message);
      throw new Error(message);
    }
  },

  async downloadPurchaseGSTMonthlyExcel(
    filters?: Omit<PurchaseMonthlyFilters, "page" | "limit">,
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.fromDate)
          params.append("fromDate", filters.fromDate.toISOString());
        if (filters.toDate)
          params.append("toDate", filters.toDate.toISOString());
        appendGstDetailsParam(params, filters.gstDetails);
      }

      const response = await apiClient.get<Blob>(
        `/purchases/purchase-gst-monthly/excel?${params.toString()}`,
        { responseType: "blob" },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading monthly GST Excel:", message);
      throw new Error(message);
    }
  },

  async downloadPurchaseBillPreviewPDF(id: number): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(
        `/purchases/${id}/bill-preview/pdf`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading purchase bill preview PDF:", message);
      throw new Error(message);
    }
  },

  async getPurchaseBillPreview(id: number): Promise<PurchaseBillPreviewData> {
    try {
      const response = await apiClient.get<
        ApiResponse<PurchaseBillPreviewData>
      >(`/purchases/${id}/bill-preview`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching purchase bill preview:", message);
      throw new Error(message);
    }
  },
};
