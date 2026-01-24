
// src/types/salesman.ts
export interface Salesman {
  id: number;
  name: string;
  phoneNo: string;
  email: string;
  area: string;
  status: boolean;
  deleted: boolean;
  createdAt: string;
}

export interface SalesmanFormData {
  name: string;
  phoneNo: string;
  email?: string;
  area: string;
  status: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: {
    salesmen: T[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface SalesmanFilters {
  search?: string;
  name?: string;
  area?: string;
  status?: "all" | "active" | "inactive";
  showDeleted?: boolean;
}