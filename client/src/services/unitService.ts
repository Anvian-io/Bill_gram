import { apiClient } from "../api/api-client";
import {
  type Unit,
  type UnitFormData,
  type PaginatedResponse,
  type ApiResponse,
  type UnitFilters,
} from "@/types/unit";

export const unitService = {
  // Get all units with pagination and filters
  async getUnits(
    page: number = 1,
    limit: number = 10,
    filters?: UnitFilters,
  ): Promise<PaginatedResponse<Unit>> {
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

    const response = await apiClient.get<PaginatedResponse<Unit>>(
      `/units?${params.toString()}`,
    );
    return response.data;
  },

  // Get active units (for dropdowns)
  async getActiveUnits(): Promise<Unit[]> {
    const response =
      await apiClient.get<ApiResponse<{ units: Unit[] }>>("/units/active");
    return response.data.data.units || [];
  },

  // Get single unit
  async getUnit(id: number): Promise<Unit> {
    const response = await apiClient.get<ApiResponse<Unit>>(`/units/${id}`);
    return response.data.data;
  },

  // Create unit
  async createUnit(data: UnitFormData): Promise<Unit> {
    const response = await apiClient.post<ApiResponse<Unit>>("/units", data);
    return response.data.data;
  },

  // Update unit
  async updateUnit(id: number, data: UnitFormData): Promise<Unit> {
    const response = await apiClient.put<ApiResponse<Unit>>(
      `/units/${id}`,
      data,
    );
    return response.data.data;
  },

  // Delete unit
  async deleteUnit(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/units/${id}`);
  },

  // Update unit status
  async updateUnitStatus(id: number, status: boolean): Promise<Unit> {
    const response = await apiClient.patch<ApiResponse<Unit>>(
      `/units/${id}/status`,
      { status },
    );
    return response.data.data;
  },

  // Bulk delete units
  async bulkDeleteUnits(
    ids: number[],
  ): Promise<{ message: string; deletedCount: number }> {
    const response = await apiClient.delete<
      ApiResponse<{ message: string; deletedCount: number }>
    >("/units", { data: { ids } });
    return response.data.data;
  },
};
