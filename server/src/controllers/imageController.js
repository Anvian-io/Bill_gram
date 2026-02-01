import { sendResponse, asyncHandler, statusType } from "../utils/index.js";
import path from "path";
import fs from "fs";
import { getDatabasePath } from "../db/database.js";

/**
 * Get images directory path
 */
function getImagesDirectory() {
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  const imagesDir = path.join(dbDir, "images");

  // Ensure directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  return imagesDir;
}

/**
 * Generate unique image filename
 */
function generateImageFilename(originalname) {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  const ext = path.extname(originalname) || ".jpg";
  return `${timestamp}-${random}${ext}`;
}

/**
 * Upload Image
 */
export const uploadImage = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return sendResponse(
        res,
        statusType.BAD_REQUEST,
        null,
        "No image file provided",
      );
    }

    const imagesDir = getImagesDirectory();
    const originalFilename = req.file.originalname;
    const filename = generateImageFilename(originalFilename);
    const filePath = path.join(imagesDir, filename);

    // Move the uploaded file to the images directory
    fs.writeFileSync(filePath, req.file.buffer);

    return sendResponse(
      res,
      statusType.CREATED,
      {
        message: "Image uploaded successfully",
        filename,
        path: filePath,
      },
      "Image uploaded",
    );
  } catch (error) {
    console.error("Error uploading image:", error);
    return sendResponse(
      res,
      statusType.INTERNAL_SERVER_ERROR,
      null,
      "Error uploading image",
    );
  }
});

/**
 * Delete Image
 */
export const deleteImage = asyncHandler(async (req, res) => {
  const { imageName } = req.params;

  if (!imageName) {
    return sendResponse(
      res,
      statusType.BAD_REQUEST,
      null,
      "Image name is required",
    );
  }

  try {
    const imagesDir = getImagesDirectory();
    const filePath = path.join(imagesDir, imageName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return sendResponse(res, statusType.NOT_FOUND, null, "Image not found");
    }

    // Check if image is being used by any product
    // This would require querying the database
    // For now, we'll just delete the file
    // In production, you should check database references first

    // Delete the file
    fs.unlinkSync(filePath);

    return sendResponse(
      res,
      statusType.OK,
      { message: "Image deleted successfully" },
      "Image deleted",
    );
  } catch (error) {
    console.error("Error deleting image:", error);
    return sendResponse(
      res,
      statusType.INTERNAL_SERVER_ERROR,
      null,
      "Error deleting image",
    );
  }
});

// Export all functions
export const imageController = {
  uploadImage,
  deleteImage,
};
