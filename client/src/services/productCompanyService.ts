// src/services/productCompanyService.ts
import { apiClient } from "../api/api-client";
import {
  type ProductCompany,
  type ProductCompanyFormData,
  type PaginatedResponse,
  type ApiResponse,
  type ProductCompanyFilters,
} from "@/types/productCompany";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";

export const productCompanyService = {
  // Get all product companies with pagination and filters
  async getProductCompanies(
    page: number = 1,
    limit: number = 10,
    filters?: ProductCompanyFilters,
  ): Promise<PaginatedResponse<ProductCompany>> {
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

      const response = await apiClient.get<PaginatedResponse<ProductCompany>>(
        `/product-companies?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching product companies:", message);
      throw new Error(message);
    }
  },

  // Get active product companies (for dropdowns)
  async getActiveProductCompanies(): Promise<ProductCompany[]> {
    try {
      const response = await apiClient.get<
        ApiResponse<{ companies: ProductCompany[] }>
      >("/product-companies/active");
      return response.data.data.companies || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching active product companies:", message);
      throw new Error(message);
    }
  },

  // Get single product company
  async getProductCompany(id: number): Promise<ProductCompany> {
    try {
      const response = await apiClient.get<ApiResponse<ProductCompany>>(
        `/product-companies/${id}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching product company:", message);
      throw new Error(message);
    }
  },

  // Create product company
  async createProductCompany(
    data: ProductCompanyFormData,
  ): Promise<ProductCompany> {
    try {
      const response = await apiClient.post<ApiResponse<ProductCompany>>(
        "/product-companies",
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error creating product company:", message);
      throw new Error(message);
    }
  },

  // Update product company
  async updateProductCompany(
    id: number,
    data: ProductCompanyFormData,
  ): Promise<ProductCompany> {
    try {
      const response = await apiClient.put<ApiResponse<ProductCompany>>(
        `/product-companies/${id}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating product company:", message);
      throw new Error(message);
    }
  },

  // Delete product company
  async deleteProductCompany(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/product-companies/${id}`);
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error deleting product company:", message);
      throw new Error(message);
    }
  },
};
