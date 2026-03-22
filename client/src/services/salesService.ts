import { apiClient } from "../api/api-client";
import type {
  Sales,
  SalesFormData,
  PaginatedResponse,
  ApiResponse,
  SalesFilters,
  SalesBillPreviewData,
} from "@/types/sales";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";
import type {
  SalesReportItem,
  SalesReportFilters,
  AreaWiseReportItem,
  SalesmanWiseReportItem,
  SalesSummaryReportData,
  SalesRegisterReportData,
  AreaWisePDFData,
  SalesmanWisePDFData,
  SalesGSTFilters,
  SalesGSTResponse,
  SalesB2CFilters,
  SalesB2CResponse,
  HSNSummaryFilters,
  HSNSummaryResponse,
  SalesMonthlyFilters,
  SalesMonthlyGSTResponse,
  PaginatedSalesHistoryResponse,
  SalesReportHistoryFilters,
} from "@/types/sales-report";

const appendGstDetailsParam = (
  params: URLSearchParams,
  gstDetails?: string,
) => {
  if (gstDetails !== undefined && gstDetails !== "" && gstDetails !== "all") {
    params.append("gstDetails", gstDetails);
  }
};

export const salesService = {
  async getSales(
    page: number = 1,
    limit: number = 10,
    filters?: SalesFilters,
  ): Promise<PaginatedResponse<Sales>> {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== "" && value !== "all") {
            if (key === "fromDate" || key === "toDate") {
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
        ApiResponse<PaginatedResponse<Sales>>
      >(`/sales?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching sales:", message);
      throw new Error(message);
    }
  },

  async getSale(id: number): Promise<Sales> {
    try {
      const response = await apiClient.get<ApiResponse<{ sale: Sales }>>(
        `/sales/${id}`,
      );
      return response.data.data.sale;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching sale:", message);
      throw new Error(message);
    }
  },

  async createSale(data: SalesFormData): Promise<Sales> {
    try {
      const response = await apiClient.post<ApiResponse<{ sale: Sales }>>(
        "/sales",
        data,
      );
      // console.log(response)
      return response.data.data.sale;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error creating sale:", message);
      throw new Error(message);
    }
  },

  async updateSale(id: number, data: SalesFormData): Promise<Sales> {
    try {
      const response = await apiClient.put<ApiResponse<{ sales: Sales }>>(
        `/sales/${id}`,
        data,
      );
      return response.data.data.sales;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating sale:", message);
      throw new Error(message);
    }
  },

  async deleteSale(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/sales/${id}`);
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error deleting sale:", message);
      throw new Error(message);
    }
  },

  async getActiveSales(): Promise<Sales[]> {
    try {
      const response =
        await apiClient.get<ApiResponse<{ sales: Sales[] }>>("/sales/active");
      return response.data.data.sales || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching active sales:", message);
      throw new Error(message);
    }
  },

  // Get sales report with filters
  async getSalesReport(
    filters: SalesReportFilters,
  ): Promise<SalesReportItem[]> {
    try {
      const params = new URLSearchParams();

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
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.productGroupId) {
        params.append("productGroupId", filters.productGroupId.toString());
      }

      const response = await apiClient.get<
        ApiResponse<{ report: SalesReportItem[] }>
      >(`/sales/report?${params.toString()}`);
      return response.data.data.report || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching sales report:", message);
      throw new Error(message);
    }
  },

  // Get area-wise sales report
  async getAreaWiseReport(
    filters: SalesReportFilters,
  ): Promise<AreaWiseReportItem[]> {
    try {
      const params = new URLSearchParams();

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
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.productGroupId) {
        params.append("productGroupId", filters.productGroupId.toString());
      }

      const response = await apiClient.get<
        ApiResponse<{ report: AreaWiseReportItem[] }>
      >(`/sales/report/area-wise?${params.toString()}`);
      return response.data.data.report || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching area-wise sales report:", message);
      throw new Error(message);
    }
  },

  // Get salesman-wise sales report
  async getSalesmanWiseReport(
    filters: SalesReportFilters,
  ): Promise<SalesmanWiseReportItem[]> {
    try {
      const params = new URLSearchParams();

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
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.productGroupId) {
        params.append("productGroupId", filters.productGroupId.toString());
      }

      const response = await apiClient.get<
        ApiResponse<{ report: SalesmanWiseReportItem[] }>
      >(`/sales/report/salesman-wise?${params.toString()}`);
      return response.data.data.report || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching salesman-wise sales report:", message);
      throw new Error(message);
    }
  },

  // Get area-wise PDF data (for modal preview)
  async getAreaWisePDFData(
    filters: SalesReportFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<AreaWisePDFData> {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

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
      if (filters.vanId) {
        params.append("vanId", filters.vanId.toString());
      }
      if (filters.salesmanId) {
        params.append("salesmanId", filters.salesmanId.toString());
      }
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.productGroupId) {
        params.append("productGroupId", filters.productGroupId.toString());
      }

      const response = await apiClient.get<ApiResponse<AreaWisePDFData>>(
        `/sales/area-pdf-data?${params.toString()}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching area-wise PDF data:", message);
      throw new Error(message);
    }
  },

  // Get salesman-wise PDF data (for modal preview)
  async getSalesmanWisePDFData(
    filters: SalesReportFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<SalesmanWisePDFData> {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

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
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.productGroupId) {
        params.append("productGroupId", filters.productGroupId.toString());
      }

      const response = await apiClient.get<ApiResponse<SalesmanWisePDFData>>(
        `/sales/salesman-pdf-data?${params.toString()}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching salesman-wise PDF data:", message);
      throw new Error(message);
    }
  },

  // Get sales summary report PDF data (for modal preview)
  async getSalesSummaryReportPDFData(
    filters: SalesReportFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<SalesSummaryReportData> {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

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
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.productGroupId) {
        params.append("productGroupId", filters.productGroupId.toString());
      }

      const response = await apiClient.get<ApiResponse<SalesSummaryReportData>>(
        `/sales/summary-pdf-data?${params.toString()}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching sales summary report data:", message);
      throw new Error(message);
    }
  },

  // Download sales summary PDF
  async downloadSalesSummaryPDF(filters: SalesReportFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();

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
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.productGroupId) {
        params.append("productGroupId", filters.productGroupId.toString());
      }

      const response = await apiClient.get<Blob>(
        `/sales/sales-summary-report/pdf?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading sales summary PDF:", message);
      throw new Error(message);
    }
  },

  // Download sales summary Excel
  async downloadSalesSummaryExcel(filters: SalesReportFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();

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
      if (filters.productGroupId) {
        params.append("productGroupId", filters.productGroupId.toString());
      }

      const response = await apiClient.get<Blob>(
        `/sales/sales-summary-report/excel?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading sales summary Excel:", message);
      throw new Error(message);
    }
  },

  // Get sales register PDF data (for modal preview)
  async getSalesRegisterPDFData(
    filters: SalesReportFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<SalesRegisterReportData> {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

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
      appendGstDetailsParam(params, filters.gstDetails);

      const response = await apiClient.get<
        ApiResponse<SalesRegisterReportData>
      >(`/sales/register-pdf-data?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching sales register data:", message);
      throw new Error(message);
    }
  },

  // NEW: Download sales register PDF
  async downloadSalesRegisterPDF(filters: SalesReportFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();

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
      appendGstDetailsParam(params, filters.gstDetails);

      const response = await apiClient.get<Blob>(
        `/sales/sales-register-report/pdf?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading sales register PDF:", message);
      throw new Error(message);
    }
  },

  // NEW: Download sales register Excel
  async downloadSalesRegisterExcel(filters: SalesReportFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();

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
      appendGstDetailsParam(params, filters.gstDetails);

      const response = await apiClient.get<Blob>(
        `/sales/sales-register-report/excel?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading sales register Excel:", message);
      throw new Error(message);
    }
  },

  // NEW: Download area-wise PDF
  async downloadAreaWisePDF(filters: SalesReportFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();

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
      if (filters.vanId) {
        params.append("vanId", filters.vanId.toString());
      }
      if (filters.salesmanId) {
        params.append("salesmanId", filters.salesmanId.toString());
      }
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.productGroupId) {
        params.append("productGroupId", filters.productGroupId.toString());
      }

      const response = await apiClient.get<Blob>(
        `/sales/area-wise-report/pdf?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading area-wise PDF:", message);
      throw new Error(message);
    }
  },

  // NEW: Download area-wise Excel
  async downloadAreaWiseExcel(filters: SalesReportFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();

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
      if (filters.vanId) {
        params.append("vanId", filters.vanId.toString());
      }
      if (filters.salesmanId) {
        params.append("salesmanId", filters.salesmanId.toString());
      }
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.productGroupId) {
        params.append("productGroupId", filters.productGroupId.toString());
      }

      const response = await apiClient.get<Blob>(
        `/sales/area-wise-report/excel?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading area-wise Excel:", message);
      throw new Error(message);
    }
  },

  // NEW: Download salesman-wise PDF
  async downloadSalesmanWisePDF(filters: SalesReportFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();

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
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.productGroupId) {
        params.append("productGroupId", filters.productGroupId.toString());
      }

      const response = await apiClient.get<Blob>(
        `/sales/salesman-wise-report/pdf?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading salesman-wise PDF:", message);
      throw new Error(message);
    }
  },

  // NEW: Download salesman-wise Excel
  async downloadSalesmanWiseExcel(filters: SalesReportFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();

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
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.productGroupId) {
        params.append("productGroupId", filters.productGroupId.toString());
      }

      const response = await apiClient.get<Blob>(
        `/sales/salesman-wise-report/excel?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading salesman-wise Excel:", message);
      throw new Error(message);
    }
  },

  // Get sales GST data with filters (for GST reporting/returns)
  async getSalesGST(filters: SalesGSTFilters): Promise<SalesGSTResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.page) {
        params.append("page", filters.page.toString());
      }
      if (filters.limit) {
        params.append("limit", filters.limit.toString());
      }
      if (filters.customerId) {
        params.append("customerId", filters.customerId.toString());
      }
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.fromDate) {
        params.append("fromDate", filters.fromDate.toISOString());
      }
      if (filters.toDate) {
        params.append("toDate", filters.toDate.toISOString());
      }
      if (filters.sortBy) {
        params.append("sortBy", filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append("sortOrder", filters.sortOrder);
      }

      const response = await apiClient.get<ApiResponse<SalesGSTResponse>>(
        `/sales/sales-gst?${params.toString()}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching sales GST data:", message);
      throw new Error(message);
    }
  },

  // Download sales GST Excel report
  async downloadSalesGSTExcel(
    filters: Omit<SalesGSTFilters, "page" | "limit">,
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();

      if (filters.customerId) {
        params.append("customerId", filters.customerId.toString());
      }
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.fromDate) {
        params.append("fromDate", filters.fromDate.toISOString());
      }
      if (filters.toDate) {
        params.append("toDate", filters.toDate.toISOString());
      }
      if (filters.sortBy) {
        params.append("sortBy", filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append("sortOrder", filters.sortOrder);
      }

      const response = await apiClient.get<Blob>(
        `/sales/gst/excel?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading sales GST Excel:", message);
      throw new Error(message);
    }
  },

  // Get sales B2C summary data with filters
  async getSalesB2C(filters: SalesB2CFilters): Promise<SalesB2CResponse> {
    try {
      const params = new URLSearchParams();

      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.fromDate) {
        params.append("fromDate", filters.fromDate.toISOString());
      }
      if (filters.toDate) {
        params.append("toDate", filters.toDate.toISOString());
      }
      if (filters.sortBy) {
        params.append("sortBy", filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append("sortOrder", filters.sortOrder);
      }

      const response = await apiClient.get<ApiResponse<SalesB2CResponse>>(
        `/sales/b2c?${params.toString()}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching sales B2C data:", message);
      throw new Error(message);
    }
  },

  // Download GSTR1 Excel report
  async downloadGSTR1Excel(
    filters: Omit<SalesGSTFilters, "page" | "limit">,
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();

      if (filters.customerId) {
        params.append("customerId", filters.customerId.toString());
      }
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.fromDate) {
        params.append("fromDate", filters.fromDate.toISOString());
      }
      if (filters.toDate) {
        params.append("toDate", filters.toDate.toISOString());
      }
      if (filters.sortBy) {
        params.append("sortBy", filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append("sortOrder", filters.sortOrder);
      }

      const response = await apiClient.get<Blob>(
        `/sales/gstr1/excel?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading GSTR1 Excel:", message);
      throw new Error(message);
    }
  },

  // Download sales B2C Excel report
  async downloadSalesB2CExcel(filters: SalesB2CFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();

      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.fromDate) {
        params.append("fromDate", filters.fromDate.toISOString());
      }
      if (filters.toDate) {
        params.append("toDate", filters.toDate.toISOString());
      }
      if (filters.sortBy) {
        params.append("sortBy", filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append("sortOrder", filters.sortOrder);
      }

      const response = await apiClient.get<Blob>(
        `/sales/b2c/excel?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading sales B2C Excel:", message);
      throw new Error(message);
    }
  },

  // Get HSN summary report
  async getHSNSummary(filters: HSNSummaryFilters): Promise<HSNSummaryResponse> {
    try {
      const params = new URLSearchParams();
      params.append("source", filters.source || "all");
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.fromDate) {
        params.append("fromDate", filters.fromDate.toISOString());
      }
      if (filters.toDate) {
        params.append("toDate", filters.toDate.toISOString());
      }

      const response = await apiClient.get<ApiResponse<HSNSummaryResponse>>(
        `/sales/hsn-summary?${params.toString()}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching HSN summary:", message);
      throw new Error(message);
    }
  },

  // Download HSN summary report as Excel
  async downloadHSNSummaryExcel(filters: HSNSummaryFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      params.append("source", filters.source || "all");
      appendGstDetailsParam(params, filters.gstDetails);
      if (filters.fromDate) {
        params.append("fromDate", filters.fromDate.toISOString());
      }
      if (filters.toDate) {
        params.append("toDate", filters.toDate.toISOString());
      }

      const response = await apiClient.get<Blob>(
        `/sales/hsn-summary/excel?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading HSN summary Excel:", message);
      throw new Error(message);
    }
  },

  // Get sales GST monthly aggregated report
  async getSalesGSTMonthly(
    filters: SalesMonthlyFilters,
  ): Promise<SalesMonthlyGSTResponse> {
    try {
      const params = new URLSearchParams();

      if (!filters.fromDate || !filters.toDate) {
        throw new Error("Both fromDate and toDate are required");
      }

      params.append("fromDate", filters.fromDate.toISOString());
      params.append("toDate", filters.toDate.toISOString());
      appendGstDetailsParam(params, filters.gstDetails);

      const response = await apiClient.get<
        ApiResponse<SalesMonthlyGSTResponse>
      >(`/sales/sales-gst-montly?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching sales GST monthly data:", message);
      throw new Error(message);
    }
  },

  // Download sales GST monthly Excel report
  async downloadSalesGSTMonthlyExcel(
    filters: SalesMonthlyFilters,
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();

      if (!filters.fromDate || !filters.toDate) {
        throw new Error("Both fromDate and toDate are required");
      }

      params.append("fromDate", filters.fromDate.toISOString());
      params.append("toDate", filters.toDate.toISOString());
      appendGstDetailsParam(params, filters.gstDetails);

      const response = await apiClient.get<Blob>(
        `/sales/gst-monthly/excel?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading sales GST monthly Excel:", message);
      throw new Error(message);
    }
  },

  // Get all sales report history with filters & pagination
  async getSalesReportHistory(
    filters: SalesReportHistoryFilters,
  ): Promise<PaginatedSalesHistoryResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.page) {
        params.append("page", filters.page.toString());
      }
      if (filters.limit) {
        params.append("limit", filters.limit.toString());
      }
      if (filters.search) {
        params.append("search", filters.search);
      }
      if (filters.fileName) {
        params.append("fileName", filters.fileName);
      }
      if (filters.type) {
        params.append("type", filters.type);
      }
      if (filters.tab) {
        params.append("tab", filters.tab);
      }
      if (filters.sortBy) {
        params.append("sortBy", filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append("sortOrder", filters.sortOrder);
      }

      const response = await apiClient.get<
        ApiResponse<PaginatedSalesHistoryResponse>
      >(`/sales/history/all?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching sales report history:", message);
      throw new Error(message);
    }
  },

  // Download specific sales report history as PDF
  async downloadSalesReportHistoryPDF(id: number): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(`/sales/history/${id}/pdf`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading sales report history PDF:", message);
      throw new Error(message);
    }
  },

  // Download specific sales report history as Excel
  async downloadSalesReportHistoryExcel(id: number): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(`/sales/history/${id}/excel`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading sales report history Excel:", message);
      throw new Error(message);
    }
  },

  async downloadSalesBillPreviewPDF(id: number): Promise<Blob> {
    try {
      const response = await apiClient.get<Blob>(
        `/sales/${id}/bill-preview/pdf`,
        {
          responseType: "blob",
        },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error downloading sales bill preview PDF:", message);
      throw new Error(message);
    }
  },

  async getSalesBillPreview(id: number): Promise<SalesBillPreviewData> {
    try {
      const response = await apiClient.get<ApiResponse<SalesBillPreviewData>>(
        `/sales/${id}/bill-preview`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching sales bill preview:", message);
      throw new Error(message);
    }
  },
};
