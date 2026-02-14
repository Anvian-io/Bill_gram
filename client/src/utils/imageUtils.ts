// @/utils/imageUtils.ts

// API Base URL - Adjust according to your environment
const API_BASE_URL =
  import.meta.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

/**
 * Get full image URL from filename
 * Handles both full URLs and filenames
 */
export const getFullImageUrl = (
  imagePath: string | null | undefined,
): string => {
  if (!imagePath) return "";

  // If it's already a full URL (starts with http, https, or blob), return as is
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("blob:")
  ) {
    return imagePath;
  }

  // If it's just a filename, prepend the API base URL
  return `${API_BASE_URL}/api/images/${imagePath}`;
};

/**
 * Extract filename from URL
 */
export const extractFilename = (url: string): string => {
  if (!url) return "";
  // Extract filename from URL (e.g., /api/images/filename.jpg -> filename.jpg)
  if (url.includes("/")) {
    return url.split("/").pop() || url;
  }
  return url;
};
