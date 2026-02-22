import { apiClient } from "../api/api-client";
import {
  type ProductGroup,
  type ProductGroupFormData,
  type PaginatedResponse,
  type ApiResponse,
} from "@/types/productGroup";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";

export const productGroupService = {
  // Get all product groups with pagination and filters
  async getProductGroups(
    page: number = 1,
    limit: number = 10,
    filters?: any,
  ): Promise<PaginatedResponse<ProductGroup>> {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== "all" && value !== "") {
            params.append(key, value.toString());
          }
        });
      }

      const response = await apiClient.get<PaginatedResponse<ProductGroup>>(
        `/product-groups?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      console.log("error",error)
      const message = getApiErrorMessage(error);
      console.error("Error fetching product groups:", message);
      throw new Error(message);
    }
  },

  // Get single product group
  async getProductGroup(id: number): Promise<ProductGroup> {
    try {
      const response = await apiClient.get<ApiResponse<ProductGroup>>(
        `/product-groups/${id}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching product group:", message);
      throw new Error(message);
    }
  },

  // Create product group
  async createProductGroup(data: ProductGroupFormData): Promise<ProductGroup> {
    try {
      const response = await apiClient.post<ApiResponse<ProductGroup>>(
        "/product-groups",
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error creating product group:", message);
      throw new Error(message);
    }
  },

  // Update product group
  async updateProductGroup(
    id: number,
    data: ProductGroupFormData,
  ): Promise<ProductGroup> {
    try {
      const response = await apiClient.put<ApiResponse<ProductGroup>>(
        `/product-groups/${id}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating product group:", message);
      throw new Error(message);
    }
  },

  // Delete product group
  async deleteProductGroup(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/product-groups/${id}`);
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error deleting product group:", message);
      throw new Error(message);
    }
  },

  // Toggle product group status
  async toggleStatus(id: number): Promise<ProductGroup> {
    try {
      const response = await apiClient.patch<ApiResponse<ProductGroup>>(
        `/product-groups/${id}/toggle-status`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error toggling product group status:", message);
      throw new Error(message);
    }
  },

  // Get active product groups for dropdowns
  async getActiveProductGroups(): Promise<ProductGroup[]> {
    try {
      const response = await apiClient.get<
        ApiResponse<{ productGroups: ProductGroup[] }>
      >("/product-groups/active");
      return response.data.data.productGroups || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching active product groups:", message);
      throw new Error(message);
    }
  },
};
