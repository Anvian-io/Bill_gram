import express from "express";
import multer from "multer";
import { imageController } from "../controllers/imageController.js";
import path from "path";
const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Upload image
router.post("/upload", upload.single("image"), imageController.uploadImage);

// Serve image - NEW ROUTE
router.get("/:imageName", imageController.serveImage);

// Delete image
router.delete("/:imageName", imageController.deleteImage);

export default router;
