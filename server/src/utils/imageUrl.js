/**
 * Helper function to extract filename from URL
 */
export function extractFilename(url) {
  if (!url) return null;

  // Extract filename from URL (e.g., /api/images/filename.jpg -> filename.jpg)
  // or just return the filename if it's already just a filename
  if (url.includes("/")) {
    return url.split("/").pop();
  }
  return url;
}

/**
 * Helper function to convert filename to public URL
 */
export function getImageUrl(filename) {
  if (!filename) return null;
  // Return public API URL path
  // return `/api/images/${filename}`;
  return `${filename}`;
}
