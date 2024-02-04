import express from "express";
import {
    createUser,
    getUserById,
    updateUser,
    deleteUser,
} from "../controllers/userControllers.js";

const router = express.Router();

// Create a new user
router.post("/", createUser);

// Get a specific user by ID
router.get("/:id", getUserById);

// Update a user by ID
router.put("/:id", updateUser);

// Delete a user by ID
router.delete("/:id", deleteUser);

export default router;
