// src/services/vanService.ts
import { apiClient } from "../api/api-client";
import {
  type Van,
  type VanFormData,
  type PaginatedResponse,
  type ApiResponse,
  type VanFilters,
} from "@/types/van";

export const vanService = {
  // Get all vans with pagination and filters
  async getVans(
    page: number = 1,
    limit: number = 10,
    filters?: VanFilters,
  ): Promise<PaginatedResponse<Van>> {
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
  },

  // Get active vans (for dropdowns)
  async getActiveVans(): Promise<Van[]> {
    const response =
      await apiClient.get<ApiResponse<{ vans: Van[] }>>("/vans/active");
    return response.data.data.vans || [];
  },

  // Get single van
  async getVan(id: number): Promise<Van> {
    const response = await apiClient.get<ApiResponse<Van>>(`/vans/${id}`);
    return response.data.data;
  },

  // Create van
  async createVan(data: VanFormData): Promise<Van> {
    const response = await apiClient.post<ApiResponse<Van>>("/vans", data);
    return response.data.data;
  },

  // Update van
  async updateVan(id: number, data: VanFormData): Promise<Van> {
    const response = await apiClient.put<ApiResponse<Van>>(`/vans/${id}`, data);
    return response.data.data;
  },

  // Delete van
  async deleteVan(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/vans/${id}`);
  },
};
