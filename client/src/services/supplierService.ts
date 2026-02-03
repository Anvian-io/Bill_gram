import { apiClient } from "../api/api-client";
import {
  type Supplier,
  type SupplierFormData,
  type PaginatedResponse,
  type ApiResponse,
  type SupplierFilters,
} from "@/types/supplier";

export const supplierService = {
  // Get all suppliers with pagination and filters
  async getSuppliers(
    page: number = 1,
    limit: number = 10,
    filters?: SupplierFilters,
  ): Promise<PaginatedResponse<Supplier>> {
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
  },

  // Get active suppliers (for dropdowns)
  async getActiveSuppliers(): Promise<Supplier[]> {
    const response =
      await apiClient.get<ApiResponse<{ suppliers: Supplier[] }>>(
        "/suppliers/active",
      );
    return response.data.data.suppliers || [];
  },

  // Get single supplier
  async getSupplier(id: number): Promise<Supplier> {
    const response = await apiClient.get<ApiResponse<Supplier>>(
      `/suppliers/${id}`,
    );
    return response.data.data;
  },

  // Create supplier
  async createSupplier(data: SupplierFormData): Promise<Supplier> {
    const response = await apiClient.post<ApiResponse<Supplier>>(
      "/suppliers",
      data,
    );
    return response.data.data;
  },

  // Update supplier
  async updateSupplier(id: number, data: SupplierFormData): Promise<Supplier> {
    const response = await apiClient.put<ApiResponse<Supplier>>(
      `/suppliers/${id}`,
      data,
    );
    return response.data.data;
  },

  // Delete supplier
  async deleteSupplier(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/suppliers/${id}`);
  },

  // Bulk import suppliers (optional)
  async bulkImportSuppliers(data: SupplierFormData[]): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      "/suppliers/bulk-import",
      { suppliers: data },
    );
    return response.data;
  },
};
