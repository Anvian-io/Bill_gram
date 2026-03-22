// src/services/vanService.ts
import { apiClient } from "../api/api-client";
import {
  type Van,
  type VanFormData,
  type PaginatedResponse,
  type ApiResponse,
  type VanFilters,
} from "@/types/van";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";

export const vanService = {
  // Get all vans with pagination and filters
  async getVans(
    page: number = 1,
    limit: number = 10,
    filters?: VanFilters,
  ): Promise<PaginatedResponse<Van>> {
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

      const response = await apiClient.get<PaginatedResponse<Van>>(
        `/vans?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching vans:", message);
      throw new Error(message);
    }
  },

  // Get active vans (for dropdowns)
  async getActiveVans(): Promise<Van[]> {
    try {
      const response =
        await apiClient.get<ApiResponse<{ vans: Van[] }>>("/vans/active");
      return response.data.data.vans || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching active vans:", message);
      throw new Error(message);
    }
  },

  // Get single van
  async getVan(id: number): Promise<Van> {
    try {
      const response = await apiClient.get<ApiResponse<Van>>(`/vans/${id}`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching van:", message);
      throw new Error(message);
    }
  },

  // Create van
  async createVan(data: VanFormData): Promise<Van> {
    try {
      const response = await apiClient.post<ApiResponse<Van>>("/vans", data);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error creating van:", message);
      throw new Error(message);
    }
  },

  // Update van
  async updateVan(id: number, data: VanFormData): Promise<Van> {
    try {
      const response = await apiClient.put<ApiResponse<Van>>(
        `/vans/${id}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating van:", message);
      throw new Error(message);
    }
  },

  // Delete van
  async deleteVan(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/vans/${id}`);
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error deleting van:", message);
      throw new Error(message);
    }
  },
};
