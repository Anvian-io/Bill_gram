import { apiClient } from "../api/api-client";
import {
  type Unit,
  type UnitFormData,
  type PaginatedResponse,
  type ApiResponse,
  type UnitFilters,
} from "@/types/unit";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";

export const unitService = {
  // Get all units with pagination and filters
  async getUnits(
    page: number = 1,
    limit: number = 10,
    filters?: UnitFilters,
  ): Promise<PaginatedResponse<Unit>> {
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

      const response = await apiClient.get<PaginatedResponse<Unit>>(
        `/units?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching units:", message);
      throw new Error(message);
    }
  },

  // Get active units (for dropdowns)
  async getActiveUnits(): Promise<Unit[]> {
    try {
      const response =
        await apiClient.get<ApiResponse<{ units: Unit[] }>>("/units/active");
      return response.data.data.units || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching active units:", message);
      throw new Error(message);
    }
  },

  // Get single unit
  async getUnit(id: number): Promise<Unit> {
    try {
      const response = await apiClient.get<ApiResponse<Unit>>(`/units/${id}`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching unit:", message);
      throw new Error(message);
    }
  },

  // Create unit
  async createUnit(data: UnitFormData): Promise<Unit> {
    try {
      const response = await apiClient.post<ApiResponse<Unit>>("/units", data);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error creating unit:", message);
      throw new Error(message);
    }
  },

  // Update unit
  async updateUnit(id: number, data: UnitFormData): Promise<Unit> {
    try {
      const response = await apiClient.put<ApiResponse<Unit>>(
        `/units/${id}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating unit:", message);
      throw new Error(message);
    }
  },

  // Delete unit
  async deleteUnit(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/units/${id}`);
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error deleting unit:", message);
      throw new Error(message);
    }
  },

  // Update unit status
  async updateUnitStatus(id: number, status: boolean): Promise<Unit> {
    try {
      const response = await apiClient.patch<ApiResponse<Unit>>(
        `/units/${id}/status`,
        { status },
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating unit status:", message);
      throw new Error(message);
    }
  },

  // Bulk delete units
  async bulkDeleteUnits(
    ids: number[],
  ): Promise<{ message: string; deletedCount: number }> {
    try {
      const response = await apiClient.delete<
        ApiResponse<{ message: string; deletedCount: number }>
      >("/units", { data: { ids } });
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error bulk deleting units:", message);
      throw new Error(message);
    }
  },
};
