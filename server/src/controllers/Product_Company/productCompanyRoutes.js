import express from "express";
import { productCompanyController } from "./productCompanyController.js";

const router = express.Router();

// Create a new product company
router.post("/", productCompanyController.createProductCompany);

// Get all product companies with pagination and filters
router.get("/", productCompanyController.getProductCompanies);

// Get active product companies (for dropdowns)
router.get("/active", productCompanyController.getActiveProductCompanies);

// Get a single product company by ID
router.get("/:id", productCompanyController.getProductCompanyById);

// Update a product company
router.put("/:id", productCompanyController.updateProductCompany);

// Delete a product company (soft delete)
router.delete("/:id", productCompanyController.deleteProductCompany);

export default router;
