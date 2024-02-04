import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./src/app.js";
import redisClient from "./src/utils/redis.js";

dotenv.config();

const mongoURI = process.env.MONGODB_URI;

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
    }
};

connectToMongoDB();

await redisClient.connect();

app.get("/", (req, res) => {
    res.send("Server is running");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
