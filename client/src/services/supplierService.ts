import { apiClient } from "../api/api-client";
import {
  type Supplier,
  type SupplierFormData,
  type PaginatedResponse,
  type ApiResponse,
  type SupplierFilters,
} from "@/types/supplier";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";

export const supplierService = {
  // Get all suppliers with pagination and filters
  async getSuppliers(
    page: number = 1,
    limit: number = 10,
    filters?: SupplierFilters,
  ): Promise<PaginatedResponse<Supplier>> {
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

      const response = await apiClient.get<PaginatedResponse<Supplier>>(
        `/suppliers?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching suppliers:", message);
      throw new Error(message);
    }
  },

  // Get active suppliers (for dropdowns)
  async getActiveSuppliers(): Promise<Supplier[]> {
    try {
      const response =
        await apiClient.get<ApiResponse<{ suppliers: Supplier[] }>>(
          "/suppliers/active",
        );
      return response.data.data.suppliers || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching active suppliers:", message);
      throw new Error(message);
    }
  },

  // Get single supplier
  async getSupplier(id: number): Promise<Supplier> {
    try {
      const response = await apiClient.get<ApiResponse<Supplier>>(
        `/suppliers/${id}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching supplier:", message);
      throw new Error(message);
    }
  },

  // Create supplier
  async createSupplier(data: SupplierFormData): Promise<Supplier> {
    try {
      const response = await apiClient.post<ApiResponse<Supplier>>(
        "/suppliers",
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error creating supplier:", message);
      throw new Error(message);
    }
  },

  // Update supplier
  async updateSupplier(id: number, data: SupplierFormData): Promise<Supplier> {
    try {
      const response = await apiClient.put<ApiResponse<Supplier>>(
        `/suppliers/${id}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating supplier:", message);
      throw new Error(message);
    }
  },

  // Delete supplier
  async deleteSupplier(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/suppliers/${id}`);
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error deleting supplier:", message);
      throw new Error(message);
    }
  },

  // Bulk import suppliers (optional)
  async bulkImportSuppliers(data: SupplierFormData[]): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        "/suppliers/bulk-import",
        { suppliers: data },
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error bulk importing suppliers:", message);
      throw new Error(message);
    }
  },
};
