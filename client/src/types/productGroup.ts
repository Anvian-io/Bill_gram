export interface ProductGroup {
  id: number;
  name: string;
  description: string;
  productCount: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  deleted:boolean
}

export interface ProductGroupFormData {
  name: string;
  description: string;
  status: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductGroupFilters {
  search?: string;
  name?: string;
  status?: "all" | "active" | "inactive";
}
