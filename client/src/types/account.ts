// src/types/account.ts
export interface Account {
  id: number;
  accountHolder: string;
  ifscCode: string;
  bankName: string;
  description: string;
  qrCode: string | null;
  gpayNo: string | null;
  status: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountFormData {
  accountHolder: string;
  ifscCode: string;
  bankName: string;
  description?: string;
  qrCode?: string;
  gpayNo?: string;
  status: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: {
    accounts: T[];
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

export interface AccountFilters {
  search?: string;
  accountHolder?: string;
  bankName?: string;
  ifscCode?: string;
  status?: "all" | "active" | "inactive";
  showDeleted?: boolean;
}
