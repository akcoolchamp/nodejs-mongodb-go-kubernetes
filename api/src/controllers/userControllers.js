import Joi from "joi";
import User from "../models/User.js";
import redisClient from "../utils/redis.js";

const createUser = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().integer().min(1).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    try {
        const user = new User(req.body);
        await user.save();
        await redisClient.connect();
        await redisClient.del("users"); // Invalidate users cache after a neq user is created
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: "Error creating user" });
    } finally {
        await redisClient.quit();
    }
};

const getUsers = async (req, res) => {
    try {
        await redisClient.connect();
        const cachedUsers = await redisClient.get("users");
        if (cachedUsers) {
            const users = JSON.parse(cachedUsers);
            return res.json(users);
        }

        const users = await User.find();
        await redisClient.set("users", JSON.stringify(users));
        res.json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error fetching users" });
    } finally {
        await redisClient.quit();
    }
};

const getUserById = async (req, res) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
        });

        const { error } = schema.validate({ id: req.params.id });
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUser = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string(),
        email: Joi.string().email(),
        age: Joi.number().integer().min(0),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        await redisClient.connect();
        await redisClient.del("users"); // Invalidate users cache after a user is updated
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await redisClient.quit();
    }
};

const deleteUser = async (req, res) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
        });

        const { error } = schema.validate({ id: req.params.id });
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        await redisClient.connect();
        await redisClient.del("users"); // Invalidate users cache after a user is deleted
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        await redisClient.quit();
    }
};

export { createUser, getUsers, getUserById, updateUser, deleteUser };
