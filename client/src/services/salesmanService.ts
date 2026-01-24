// src/services/salesmanService.ts
import { apiClient } from "../api/api-client";
import {
  type Salesman,
  type SalesmanFormData,
  type PaginatedResponse,
  type ApiResponse,
  type SalesmanFilters,
} from "@/types/salesman";

export const salesmanService = {
  // Get all salesmen with pagination and filters
  async getSalesmen(
    page: number = 1,
    limit: number = 10,
    filters?: SalesmanFilters,
  ): Promise<PaginatedResponse<Salesman>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== "all") {
          // Convert showDeleted boolean to string
          if (key === "showDeleted") {
            params.append(key, value ? "true" : "false");
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<Salesman>>(
      `/salesmen?${params.toString()}`,
    );
    return response.data;
  },

  // Get active salesmen (for dropdowns)
  async getActiveSalesmen(): Promise<Salesman[]> {
    const response =
      await apiClient.get<ApiResponse<{ salesmen: Salesman[] }>>(
        "/salesmen/active",
      );
    return response.data.data.salesmen || [];
  },

  // Get single salesman
  async getSalesman(id: number): Promise<Salesman> {
    const response = await apiClient.get<ApiResponse<Salesman>>(
      `/salesmen/${id}`,
    );
    return response.data.data;
  },

  // Create salesman
  async createSalesman(data: SalesmanFormData): Promise<Salesman> {
    const response = await apiClient.post<ApiResponse<Salesman>>(
      "/salesmen",
      data,
    );
    return response.data.data;
  },

  // Update salesman
  async updateSalesman(id: number, data: SalesmanFormData): Promise<Salesman> {
    const response = await apiClient.put<ApiResponse<Salesman>>(
      `/salesmen/${id}`,
      data,
    );
    return response.data.data;
  },

  // Delete salesman
  async deleteSalesman(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/salesmen/${id}`);
  },
};
