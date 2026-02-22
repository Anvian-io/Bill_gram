// src/services/user.service.ts
import { apiClient } from "../api/api-client";
import type { ApiResponse, UpdateProfileData, User } from "@/types/user";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";

export const userService = {
  // Update user profile
  async updateProfile(data: UpdateProfileData): Promise<User> {
    try {
      const response = await apiClient.patch<ApiResponse<{ user: User }>>(
        "/auth/profile",
        data,
      );
      return response.data.data.user;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error updating profile:", message);
      throw new Error(message);
    }
  },
};
