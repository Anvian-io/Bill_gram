// src/services/customerService.ts
import { apiClient } from "../api/api-client";
import {
  type Customer,
  type CustomerFormData,
  type PaginatedResponse,
  type ApiResponse,
  type CustomerFilters,
} from "@/types/customer";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";

export const customerService = {
  // Get all customers with pagination and filters
  async getCustomers(
    page: number = 1,
    limit: number = 10,
    filters?: CustomerFilters,
  ): Promise<PaginatedResponse<Customer>> {
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

      const response = await apiClient.get<PaginatedResponse<Customer>>(
        `/customers?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching customers:", message);
      throw new Error(message);
    }
  },

  // Get active customers (for dropdowns)
  async getActiveCustomers(): Promise<Customer[]> {
    try {
      const response =
        await apiClient.get<ApiResponse<{ customers: Customer[] }>>(
          "/customers/active",
        );
      return response.data.data.customers || [];
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching active customers:", message);
      throw new Error(message);
    }
  },

  // Get single customer
  async getCustomer(id: number): Promise<Customer> {
    try {
      const response = await apiClient.get<ApiResponse<Customer>>(
        `/customers/${id}`,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching customer:", message);
      throw new Error(message);
    }
  },

  // Create customer
  async createCustomer(data: CustomerFormData): Promise<Customer> {
    try {
      const response = await apiClient.post<ApiResponse<Customer>>(
        "/customers",
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error creating customer:", message);
      throw new Error(message);
    }
  },

  // Update customer
  async updateCustomer(id: number, data: CustomerFormData): Promise<Customer> {
    try {
      const response = await apiClient.put<ApiResponse<Customer>>(
        `/customers/${id}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating customer:", message);
      throw new Error(message);
    }
  },

  // Delete customer
  async deleteCustomer(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/customers/${id}`);
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error deleting customer:", message);
      throw new Error(message);
    }
  },
};
