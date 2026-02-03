import { apiClient } from "../api/api-client";
import {
  type Product,
  type ProductFormData,
  type PaginatedResponse,
  type ApiResponse,
  type ProductFilters,
} from "@/types/product";

export const productService = {
  // Get all products with pagination and filters
  async getProducts(
    page: number = 1,
    limit: number = 10,
    filters?: ProductFilters,
  ): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== "all") {
          if (key === "showDeleted") {
            params.append(key, value ? "true" : "false");
          } else if (value instanceof Date) {
            params.append(key, value.toISOString().split("T")[0]);
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<Product>>(
      `/products?${params.toString()}`,
    );
    return response.data;
  },

  // Get active products (for dropdowns)
  async getActiveProducts(): Promise<Product[]> {
    const response =
      await apiClient.get<ApiResponse<{ products: Product[] }>>(
        "/products/active",
      );
      console.log('date',response.data)
    return response.data.data.products || [];
  },

  // Get single product
  async getProduct(id: number): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(
      `/products/${id}`,
    );
    return response.data.data;
  },

  // Create product
  async createProduct(data: ProductFormData): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>(
      "/products",
      data,
    );
    return response.data.data;
  },

  // Update product
  async updateProduct(id: number, data: ProductFormData): Promise<Product> {
    const response = await apiClient.put<ApiResponse<Product>>(
      `/products/${id}`,
      data,
    );
    return response.data.data;
  },

  // Delete product
  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/products/${id}`);
  },
};
