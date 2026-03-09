import { apiClient } from "../api/api-client";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";
import type {
  ApiResponse,
  GSTReportHistoryFilters,
  PaginatedGSTHistoryResponse,
} from "@/types/sales-report";

export const gstHistoryService = {
  async getGSTReportHistory(
    filters: GSTReportHistoryFilters,
  ): Promise<PaginatedGSTHistoryResponse> {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.search) params.append("search", filters.search);
      if (filters.fileName) params.append("fileName", filters.fileName);
      if (filters.type) params.append("type", filters.type);
      if (filters.source) params.append("source", filters.source);
      if (filters.reportKey) params.append("reportKey", filters.reportKey);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

      const response = await apiClient.get<
        ApiResponse<PaginatedGSTHistoryResponse>
      >(`/gst-history/all?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error fetching GST report history:", message);
      throw new Error(message);
    }
  },
};
