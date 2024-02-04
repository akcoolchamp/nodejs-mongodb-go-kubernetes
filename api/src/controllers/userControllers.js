import Joi from "joi";
import User from "../models/User.js";
import redisClient from "../utils/redis.js";
import { successMessages, errorMessages } from "../utils/messages.js";

// Controller function to create a new user
const createUser = async (req, res) => {
    // Schema for validating request body
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().integer().min(1).required(),
    });

    // Validate request body
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: errorMessages.invalidUserData });
    }
    try {
        // Check if user exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser)
            return res.status(401).json({ error: errorMessages.userExists });
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: errorMessages.serverError });
    }
};

// Controller function to get user by ID
const getUserById = async (req, res) => {
    try {
        // Schema for validating request parameters
        const schema = Joi.object({
            id: Joi.string()
                .required()
                .regex(/^[a-fA-F0-9]{24}$/)
                .required(),
        });

        // Validate request parameters
        const { error } = schema.validate({ id: req.params.id });
        if (error) {
            return res.status(400).json({ error: errorMessages.invalidId });
        }
        const cachedUser = await redisClient.get(req.params.id);
        if (cachedUser) {
            const user = JSON.parse(cachedUser);
            return res.json(user);
        }

        // Retrieve user from database
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: errorMessages.userNotFound });
        }
        await redisClient.set(req.params.id, JSON.stringify(user));
        res.json(user);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: errorMessages.serverError });
    }
};

// Controller function to update user by ID
const updateUser = async (req, res) => {
    // Schema for validating request body
    const schema = Joi.object({
        name: Joi.string(),
        email: Joi.string().email(),
        age: Joi.number().integer().min(1),
    });

    // Validate request body
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: errorMessages.invalidUserData });
    }

    try {
        // Update user in database
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!user) {
            return res.status(404).json({ error: errorMessages.userNotFound });
        }
        // Invalidate user's cache after a user is updated
        await redisClient.del(req.params.id);
        res.json({ message: successMessages.userUpdated, user });
    } catch (error) {
        res.status(500).json({ error: errorMessages.serverError });
    }
};

// Controller function to delete user by ID
const deleteUser = async (req, res) => {
    try {
        // Schema for validating request parameters
        const schema = Joi.object({
            id: Joi.string()
                .required()
                .regex(/^[a-fA-F0-9]{24}$/),
        });

        // Validate request parameters
        const { error } = schema.validate({ id: req.params.id });
        if (error) {
            return res.status(400).json({ error: errorMessages.invalidId });
        }

        // Delete user from database
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: errorMessages.userNotFound });
        }
        // Invalidate user's cache after a user is deleted
        await redisClient.del(req.params.id);
        res.json({ message: successMessages.userDeleted });
    } catch (error) {
        res.status(500).json({ error: errorMessages.serverError });
    }
};

export { createUser, getUserById, updateUser, deleteUser };
