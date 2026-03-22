import { apiClient } from "../api/api-client";
import { getApiErrorMessage } from "@/utils/apiErrorhelper";

export interface ImageUploadResponse {
  message: string;
  filename: string;
  path: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export const imageService = {
  // Upload image
  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await apiClient.post<ApiResponse<ImageUploadResponse>>(
        "/images/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data.data.filename;
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error uploading image:", message);
      throw new Error(message);
    }
  },

  // Delete image
  async deleteImage(imageName: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/images/${imageName}`);
    } catch (error) {
      const message = getApiErrorMessage(error);
      console.error("Error deleting image:", message);
      throw new Error(message);
    }
  },
};
