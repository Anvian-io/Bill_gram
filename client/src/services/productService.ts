import { apiClient } from "../api/api-client";
import {
  type Product,
  type ProductFormData,
  type PaginatedResponse,
  type ApiResponse,
  type ProductFilters,
  type ProductBatchesResponse,
} from "@/types/product";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";

export const productService = {
  // Get all products with pagination and filters
  async getProducts(
    page: number = 1,
    limit: number = 10,
    filters?: ProductFilters,
  ): Promise<PaginatedResponse<Product>> {
    try {
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
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching products:", message);
      throw new Error(message);
    }
  },

  // Get active products (for dropdowns)
  async getActiveProducts(): Promise<Product[]> {
    try {
      const response =
        await apiClient.get<ApiResponse<{ products: Product[] }>>(
          "/products/active",
        );
      console.log("date", response.data);
      return response.data.data.products || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching active products:", message);
      throw new Error(message);
    }
  },

  // Get single product
  async getProduct(id: number): Promise<Product> {
    try {
      const response = await apiClient.get<ApiResponse<Product>>(
        `/products/${id}`,
      );
      return response.data.data.product;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching product:", message);
      throw new Error(message);
    }
  },

  // Create product
  async createProduct(data: ProductFormData): Promise<Product> {
    try {
      const response = await apiClient.post<ApiResponse<Product>>(
        "/products",
        data,
      );
      return response.data.data.product;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error creating product:", message);
      throw new Error(message);
    }
  },

  // Update product
  async updateProduct(id: number, data: ProductFormData): Promise<Product> {
    try {
      const response = await apiClient.put<ApiResponse<Product>>(
        `/products/${id}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating product:", message);
      throw new Error(message);
    }
  },

  // Delete product
  async deleteProduct(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/products/${id}`);
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error deleting product:", message);
      throw new Error(message);
    }
  },

  // Get product batches
  async getProductBatches(id: number): Promise<ProductBatchesResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProductBatchesResponse>>(
        `/products/${id}/batches`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching product batches:", message);
      throw new Error(message);
    }
  },

  async getProductPurchaseHistory(productId: number) {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          histories: ProductBatchHistoryEntry[];
          activeBatches: unknown[];
        }>
      >(`/products/${productId}/purchase-history`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching product purchase history:", message);
      throw new Error(message);
    }
  },

  async getProductSalesHistory(productId: number) {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          histories: ProductBatchHistoryEntry[];
          activeBatches: unknown[];
        }>
      >(`/products/${productId}/sales-history`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching product sales history:", message);
      throw new Error(message);
    }
  },
};

export interface ProductBatchHistoryEntry {
  id: number;
  batchId: number | null;
  batchNo: string;
  invoiceNo: string;
  invoiceDate: string;
  quantity: number;
  rate: number;
  amount: number;
  currentRate: number;
  currentStock: number;
  supplierName?: string;
  customerName?: string;
}
