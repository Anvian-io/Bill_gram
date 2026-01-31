import { apiClient } from "../api/api-client";
import {
  type ProductGroup,
  type ProductGroupFormData,
  type PaginatedResponse,
  type ApiResponse,
} from "@/types/productGroup";

export const productGroupService = {
  // Get all product groups with pagination and filters
  async getProductGroups(
    page: number = 1,
    limit: number = 10,
    filters?: any,
  ): Promise<PaginatedResponse<ProductGroup>> {
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
    // console.log(response)
    return response.data;
  },

  // Get single product group
  async getProductGroup(id: number): Promise<ProductGroup> {
    const response = await apiClient.get<ApiResponse<ProductGroup>>(
      `/product-groups/${id}`,
    );
    return response.data.data;
  },

  // Create product group
  async createProductGroup(data: ProductGroupFormData): Promise<ProductGroup> {
    const response = await apiClient.post<ApiResponse<ProductGroup>>(
      "/product-groups",
      data,
    );
    return response.data.data;
  },

  // Update product group
  async updateProductGroup(
    id: number,
    data: ProductGroupFormData,
  ): Promise<ProductGroup> {
    const response = await apiClient.put<ApiResponse<ProductGroup>>(
      `/product-groups/${id}`,
      data,
    );
    return response.data.data;
  },

  // Delete product group
  async deleteProductGroup(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/product-groups/${id}`);
  },

  // Toggle product group status
  async toggleStatus(id: number): Promise<ProductGroup> {
    const response = await apiClient.patch<ApiResponse<ProductGroup>>(
      `/product-groups/${id}/toggle-status`,
    );
    return response.data.data;
  },

    async getActiveProductGroups(): Promise<ProductGroup[]> {
      const response = await apiClient.get<
        ApiResponse<{ productGroups: ProductGroup[] }>
      >("/product-groups/active");
      // console.log("response.data.data.groups", response.data);
      return response.data.data.productGroups || [];
    },
};
