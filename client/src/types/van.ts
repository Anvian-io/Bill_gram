// src/types/van.ts
export interface Van {
  id: number;
  name: string;
  vehicleNo: string | null;
  model: string | null;
  area: string | null;
  city: string | null;
  status: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VanFormData {
  name: string;
  vehicleNo?: string;
  model?: string;
  area?: string;
  city?: string;
  status: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: {
    vans: T[];
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

export interface VanFilters {
  search?: string;
  name?: string;
  vehicleNo?: string;
  model?: string;
  area?: string;
  city?: string;
  status?: "all" | "active" | "inactive";
  showDeleted?: boolean;
}
