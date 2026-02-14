import express from "express";
import { customerController } from "./customerController.js";

const router = express.Router();

// Create a new customer
router.post("/", customerController.createCustomer);

// Get all customers with pagination and filters
router.get("/", customerController.getCustomers);

// Get active customers (for dropdowns)
router.get("/active", customerController.getActiveCustomers);

// Get a single customer by ID
router.get("/:id", customerController.getCustomerById);

// Update a customer
router.put("/:id", customerController.updateCustomer);

// Delete a customer (soft delete)
router.delete("/:id", customerController.deleteCustomer);

export default router;
