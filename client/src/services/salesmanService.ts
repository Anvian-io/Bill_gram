// src/services/salesmanService.ts
import { apiClient } from "../api/api-client";
import {
  type Salesman,
  type SalesmanFormData,
  type PaginatedResponse,
  type ApiResponse,
  type SalesmanFilters,
} from "@/types/salesman";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";

export const salesmanService = {
  // Get all salesmen with pagination and filters
  async getSalesmen(
    page: number = 1,
    limit: number = 10,
    filters?: SalesmanFilters,
  ): Promise<PaginatedResponse<Salesman>> {
    try {
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
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching salesmen:", message);
      throw new Error(message);
    }
  },

  // Get active salesmen (for dropdowns)
  async getActiveSalesmen(): Promise<Salesman[]> {
    try {
      const response =
        await apiClient.get<ApiResponse<{ salesmen: Salesman[] }>>(
          "/salesmen/active",
        );
      return response.data.data.salesmen || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching active salesmen:", message);
      throw new Error(message);
    }
  },

  // Get single salesman
  async getSalesman(id: number): Promise<Salesman> {
    try {
      const response = await apiClient.get<ApiResponse<Salesman>>(
        `/salesmen/${id}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching salesman:", message);
      throw new Error(message);
    }
  },

  // Create salesman
  async createSalesman(data: SalesmanFormData): Promise<Salesman> {
    try {
      const response = await apiClient.post<ApiResponse<Salesman>>(
        "/salesmen",
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error creating salesman:", message);
      throw new Error(message);
    }
  },

  // Update salesman
  async updateSalesman(id: number, data: SalesmanFormData): Promise<Salesman> {
    try {
      const response = await apiClient.put<ApiResponse<Salesman>>(
        `/salesmen/${id}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating salesman:", message);
      throw new Error(message);
    }
  },

  // Delete salesman
  async deleteSalesman(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/salesmen/${id}`);
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error deleting salesman:", message);
      throw new Error(message);
    }
  },
};
