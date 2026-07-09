// src/types/customer.ts
export interface Customer {
  name: any;
  id: number;
  companyName: string;
  personName: string;
  phoneNo: string;
  email: string;
  customerType: string | null;
  city: string | null;
  areaId: number | null;
  address: string;
  pincode: string | null;
  gstIN: string | null;
  status: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  companyName: string;
  personName?: string;
  phoneNo: string;
  email?: string;
  customerType?: string;
  city?: string;
  areaId?: number | null;
  address: string;
  pincode?: string;
  gstIN?: string;
  status: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: {
    customers: T[];
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

export interface CustomerFilters {
  search?: string;
  companyName?: string;
  personName?: string;
  phoneNo?: string;
  city?: string;
  gstIN?: string;
  areaId?: string;
  customerType?: string;
  status?: "all" | "active" | "inactive";
  showDeleted?: boolean;
}
