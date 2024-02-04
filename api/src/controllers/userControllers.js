import Joi from "joi";
import User from "../models/User.js";
import redisClient from "../utils/redis.js";
import { successMessages, errorMessages } from "../utils/messages.js";

const createUser = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().integer().min(1).required(),
    });

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

const getUserById = async (req, res) => {
    try {
        const schema = Joi.object({
            id: Joi.string()
                .required()
                .regex(/^[a-fA-F0-9]{24}$/)
                .required(),
        });

        const { error } = schema.validate({ id: req.params.id });
        if (error) {
            return res.status(400).json({ error: errorMessages.invalidId });
        }

        await redisClient.connect();
        const cachedUser = await redisClient.get(req.params.id);
        if (cachedUser) {
            const user = JSON.parse(cachedUser);
            return res.json(user);
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: errorMessages.userNotFound });
        }
        await redisClient.set(req.params.id, JSON.stringify(user));
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: errorMessages.serverError });
    } finally {
        await redisClient.quit();
    }
};

const updateUser = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string(),
        email: Joi.string().email(),
        age: Joi.number().integer().min(1),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: errorMessages.invalidUserData });
    }

    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!user) {
            return res.status(404).json({ error: errorMessages.userNotFound });
        }
        await redisClient.connect();
        await redisClient.del(req.params.id); // Invalidate user's cache after a user is updated
        res.json({ message: successMessages.userUpdated, user });
    } catch (error) {
        res.status(500).json({ error: errorMessages.serverError });
    } finally {
        await redisClient.quit();
    }
};

const deleteUser = async (req, res) => {
    try {
        const schema = Joi.object({
            id: Joi.string()
                .required()
                .regex(/^[a-fA-F0-9]{24}$/),
        });

        const { error } = schema.validate({ id: req.params.id });
        if (error) {
            return res.status(400).json({ error: errorMessages.invalidId });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: errorMessages.userNotFound });
        }
        await redisClient.connect();
        await redisClient.del(req.params.id); // Invalidate user's cache after a user is deleted
        res.json({ message: successMessages.userDeleted });
    } catch (error) {
        res.status(500).json({ error: errorMessages.serverError });
    } finally {
        await redisClient.quit();
    }
};

export { createUser, getUserById, updateUser, deleteUser };
