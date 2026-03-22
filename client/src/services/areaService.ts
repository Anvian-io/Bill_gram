// src/services/areaService.ts
import { apiClient } from "../api/api-client";
import {
  type Area,
  type AreaFormData,
  type PaginatedResponse,
  type ApiResponse,
  type AreaFilters,
} from "@/types/area";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";

export const areaService = {
  // Get all areas with pagination and filters
  async getAreas(
    page: number = 1,
    limit: number = 10,
    filters?: AreaFilters,
  ): Promise<PaginatedResponse<Area>> {
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

      const response = await apiClient.get<PaginatedResponse<Area>>(
        `/areas?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching areas:", message);
      throw new Error(message);
    }
  },

  // Get active areas (for dropdowns)
  async getActiveAreas(): Promise<Area[]> {
    try {
      const response =
        await apiClient.get<ApiResponse<{ areas: Area[] }>>("/areas/active");
      return response.data.data.areas || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching active areas:", message);
      throw new Error(message);
    }
  },

  // Get single area
  async getArea(id: number): Promise<Area> {
    try {
      const response = await apiClient.get<ApiResponse<Area>>(`/areas/${id}`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching area:", message);
      throw new Error(message);
    }
  },

  // Create area
  async createArea(data: AreaFormData): Promise<Area> {
    try {
      const response = await apiClient.post<ApiResponse<Area>>("/areas", data);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error creating area:", message);
      throw new Error(message);
    }
  },

  // Update area
  async updateArea(id: number, data: AreaFormData): Promise<Area> {
    try {
      const response = await apiClient.put<ApiResponse<Area>>(
        `/areas/${id}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating area:", message);
      throw new Error(message);
    }
  },

  // Delete area
  async deleteArea(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/areas/${id}`);
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error deleting area:", message);
      throw new Error(message);
    }
  },
};
