import Joi from "joi";
import User from "../models/User.js";

const createUser = async (req, res) => {
    // Validate the incoming request body using Joi
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().integer().min(1).required(), //age must be less than equal to one
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { createUser };
