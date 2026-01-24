// src/types/productCompany.ts
export interface ProductCompany {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  status: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCompanyFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  status: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: {
    companies: T[];
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

export interface ProductCompanyFilters {
  search?: string;
  name?: string;
  contactPerson?: string;
  email?: string;
  status?: "all" | "active" | "inactive";
  showDeleted?: boolean;
}
