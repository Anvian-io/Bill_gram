export interface Unit {
  id: number;
  name: string;
  symbol: string;
  status: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnitFormData {
  name: string;
  symbol: string;
  status: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: {
    units: T[];
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

export interface UnitFilters {
  search?: string;
  name?: string;
  symbol?: string;
  status?: "all" | "active" | "inactive";
  showDeleted?: boolean;
}
