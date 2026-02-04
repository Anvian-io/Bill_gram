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
        false,
        null,
        "No image file provided",
        statusType.BAD_REQUEST,
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
      true,
      {
        message: "Image uploaded successfully",
        filename,
        path: filePath,
      },
      "Image uploaded",
      statusType.CREATED,
    );
  } catch (error) {
    console.error("Error uploading image:", error);
    return sendResponse(
      res,
      false,
      null,
      "Error uploading image",
      statusType.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * Serve Image - NEW FUNCTION
 */
export const serveImage = asyncHandler(async (req, res) => {
  const { imageName } = req.params;

  if (!imageName) {
    return sendResponse(
      res,
      false,
      null,
      "Image name is required",
      statusType.BAD_REQUEST,
    );
  }

  try {
    const imagesDir = getImagesDirectory();
    const filePath = path.join(imagesDir, imageName);

    // Security check: ensure the resolved path is within images directory
    const resolvedPath = path.resolve(filePath);
    const resolvedImagesDir = path.resolve(imagesDir);

    if (!resolvedPath.startsWith(resolvedImagesDir)) {
      return sendResponse(
        res,
        false,
        null,
        "Access denied",
        statusType.FORBIDDEN,
      );
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return sendResponse(
        res,
        false,
        null,
        "Image not found",
        statusType.NOT_FOUND,
      );
    }

    // Determine content type based on extension
    const ext = path.extname(imageName).toLowerCase();
    const contentTypeMap = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
      ".svg": "image/svg+xml",
    };

    const contentType = contentTypeMap[ext] || "application/octet-stream";

    // Set headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

    // Stream the file
    const fileStream = fs.createReadStream(filePath);

    fileStream.on("error", (error) => {
      console.error("Error streaming image:", error);
      if (!res.headersSent) {
        return sendResponse(
          res,
          false,
          null,
          "Error serving image",
          statusType.INTERNAL_SERVER_ERROR,
        );
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("Error serving image:", error);
    return sendResponse(
      res,
      false,
      null,
      "Error serving image",
      statusType.INTERNAL_SERVER_ERROR,
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
      false,
      null,
      "Image name is required",
      statusType.BAD_REQUEST,
    );
  }

  try {
    const imagesDir = getImagesDirectory();
    const filePath = path.join(imagesDir, imageName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return sendResponse(
        res,
        false,
        null,
        "Image not found",
        statusType.NOT_FOUND,
      );
    }

    // Check if image is being used by any product
    // This would require querying the database
    // For now, we'll just delete the file
    // In production, you should check database references first

    // Delete the file
    fs.unlinkSync(filePath);

    return sendResponse(
      res,
      true,
      { message: "Image deleted successfully" },
      "Image deleted",
      statusType.OK,
    );
  } catch (error) {
    console.error("Error deleting image:", error);
    return sendResponse(
      res,
      false,
      null,
      "Error deleting image",
      statusType.INTERNAL_SERVER_ERROR,
    );
  }
});

// Export all functions
export const imageController = {
  uploadImage,
  serveImage, // Added to exports
  deleteImage,
};
