import { apiClient } from "../api/api-client";
import type {
  Sales,
  SalesFormData,
  PaginatedResponse,
  ApiResponse,
  SalesFilters,
} from "@/types/sales";

export const salesService = {
  async getSales(
    page: number = 1,
    limit: number = 10,
    filters?: SalesFilters,
  ): Promise<PaginatedResponse<Sales>> {
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

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Sales>>>(
      `/sales?${params.toString()}`,
    );
    return response.data.data;
  },

  async getSale(id: number): Promise<Sales> {
    const response = await apiClient.get<ApiResponse<{ sale: Sales }>>(
      `/sales/${id}`,
    );
    // console.log("API response for getSale:", response.data);
    return response.data.data.sale;
  },

  async createSale(data: SalesFormData): Promise<Sales> {
    // invoiceNo is removed – backend will generate
    const response = await apiClient.post<ApiResponse<{ sales: Sales }>>(
      "/sales",
      data,
    );
    return response.data.data.sales;
  },

  async updateSale(id: number, data: SalesFormData): Promise<Sales> {
    const response = await apiClient.put<ApiResponse<{ sales: Sales }>>(
      `/sales/${id}`,
      data,
    );
    return response.data.data.sales;
  },

  async deleteSale(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/sales/${id}`);
  },

  async getActiveSales(): Promise<Sales[]> {
    const response =
      await apiClient.get<ApiResponse<{ sales: Sales[] }>>("/sales/active");
    return response.data.data.sales || [];
  },
};
