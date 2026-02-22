import { apiClient } from "../api/api-client";
import type {
  Sales,
  SalesFormData,
  PaginatedResponse,
  ApiResponse,
  SalesFilters,
} from "@/types/sales";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";

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
      // invoiceNo is removed – backend will generate
      const response = await apiClient.post<ApiResponse<{ sales: Sales }>>(
        "/sales",
        data,
      );
      return response.data.data.sales;
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
};
