// src/services/user.service.ts
import { apiClient } from "../api/api-client";
import type { ApiResponse, UpdateProfileData, User } from "@/types/user";

export const userService = {
  // Update user profile
  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await apiClient.patch<ApiResponse<{ user: User }>>(
      "/auth/profile",
      data,
    );
    return response.data.data.user;
  },
};
