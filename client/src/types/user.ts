// src/types/user.ts
export interface User {
  id: number;
  username: string;
  email: string;
  shop_name: string | null;
  phone: string | null;
  notification: boolean;
  sound: boolean;
  company_logo: string | null;
  upi_id: string | null;
  company_name: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  shop_name?: string | null;
  phone?: string | null;
  notification?: boolean;
  sound?: boolean;
  company_logo?: string | null;
  upi_id?: string | null;
  company_name?: string | null;
  address?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
