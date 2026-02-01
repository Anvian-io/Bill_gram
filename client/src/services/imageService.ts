import { apiClient } from "../api/api-client";

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
  },

  // Delete image
  async deleteImage(imageName: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/images/${imageName}`);
  },
};
