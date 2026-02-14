import { apiClient } from "../api/api-client";
import type {
  Purchase,
  PurchaseFormData,
  PaginatedResponse,
  ApiResponse,
  PurchaseFilters,
} from "@/types/purchase";

export const purchaseService = {
  // Get all purchases with pagination & filters
  async getPurchases(
    page: number = 1,
    limit: number = 10,
    filters?: PurchaseFilters,
  ): Promise<PaginatedResponse<Purchase>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== "all") {
          if (key === "fromDate" || key === "toDate") {
            // send as ISO string
            params.append(key, new Date(value as string).toISOString());
          } else if (key === "showDeleted") {
            params.append(key, value ? "true" : "false");
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Purchase>>
    >(`/purchases?${params.toString()}`);
    return response.data.data;
  },

  // Get single purchase by ID
  async getPurchase(id: number): Promise<Purchase> {
    const response = await apiClient.get<ApiResponse<{ purchase: Purchase }>>(
      `/purchases/${id}`,
    );
    return response.data.data.purchase;
  },

  // Create new purchase invoice
  async createPurchase(data: PurchaseFormData): Promise<Purchase> {
    const response = await apiClient.post<ApiResponse<{ purchase: Purchase }>>(
      "/purchases",
      data,
    );
    return response.data.data.purchase;
  },

  // Update purchase invoice
  async updatePurchase(id: number, data: PurchaseFormData): Promise<Purchase> {
    const response = await apiClient.put<ApiResponse<{ purchase: Purchase }>>(
      `/purchases/${id}`,
      data,
    );
    return response.data.data.purchase;
  },

  // Delete purchase (soft delete)
  async deletePurchase(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/purchases/${id}`);
  },

  // Get active purchases (for dropdowns)
  async getActivePurchases(): Promise<Purchase[]> {
    const response =
      await apiClient.get<ApiResponse<{ purchases: Purchase[] }>>(
        "/purchases/active",
      );
    return response.data.data.purchases || [];
  },
};
