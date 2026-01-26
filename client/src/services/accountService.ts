// src/services/accountService.ts
import { apiClient } from "../api/api-client";
import {
  type Account,
  type AccountFormData,
  type PaginatedResponse,
  type ApiResponse,
  type AccountFilters,
} from "@/types/account";

export const accountService = {
  // Get all accounts with pagination and filters
  async getAccounts(
    page: number = 1,
    limit: number = 10,
    filters?: AccountFilters,
  ): Promise<PaginatedResponse<Account>> {
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

    const response = await apiClient.get<PaginatedResponse<Account>>(
      `/accounts?${params.toString()}`,
    );
    return response.data;
  },

  // Get active accounts (for dropdowns)
  async getActiveAccounts(): Promise<Account[]> {
    const response =
      await apiClient.get<ApiResponse<{ accounts: Account[] }>>(
        "/accounts/active",
      );
    return response.data.data.accounts || [];
  },

  // Get single account
  async getAccount(id: number): Promise<Account> {
    const response = await apiClient.get<ApiResponse<Account>>(
      `/accounts/${id}`,
    );
    return response.data.data;
  },

  // Create account
  async createAccount(data: AccountFormData): Promise<Account> {
    const response = await apiClient.post<ApiResponse<Account>>(
      "/accounts",
      data,
    );
    return response.data.data;
  },

  // Update account
  async updateAccount(id: number, data: AccountFormData): Promise<Account> {
    const response = await apiClient.put<ApiResponse<Account>>(
      `/accounts/${id}`,
      data,
    );
    return response.data.data;
  },

  // Delete account
  async deleteAccount(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/accounts/${id}`);
  },
};
