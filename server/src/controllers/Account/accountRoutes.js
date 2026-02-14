import express from "express";
import { accountController } from "./accountController.js";

const router = express.Router();

// Create a new account
router.post("/", accountController.createAccount);

// Get all accounts with pagination and filters
router.get("/", accountController.getAccounts);

// Get active accounts (for dropdowns)
router.get("/active", accountController.getActiveAccounts);

// Get a single account by ID
router.get("/:id", accountController.getAccountById);

// Update an account
router.put("/:id", accountController.updateAccount);

// Delete an account (soft delete)
router.delete("/:id", accountController.deleteAccount);

export default router;
