// src/types/area.ts
export interface Area {
  id: number;
  name: string;
  state: string | null;
  region: string | null;
  city: string | null;
  description: string | null;
  pincode: string | null;
  status: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AreaFormData {
  name: string;
  state?: string;
  region?: string;
  city?: string;
  description?: string;
  pincode?: string;
  status: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: {
    areas: T[];
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

export interface AreaFilters {
  search?: string;
  name?: string;
  state?: string;
  region?: string;
  city?: string;
  status?: "all" | "active" | "inactive";
  showDeleted?: boolean;
}
