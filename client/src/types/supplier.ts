export interface Supplier {
  id: number;
  name: string;
  phoneNo: string;
  email: string;
  address: string | null;
  status: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormData {
  name: string;
  phoneNo: string;
  email?: string;
  address?: string;
  status: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: {
    suppliers: T[];
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

export interface SupplierFilters {
  search?: string;
  name?: string;
  phoneNo?: string;
  email?: string;
  address?: string;
  status?: "all" | "active" | "inactive";
  showDeleted?: boolean;
}
