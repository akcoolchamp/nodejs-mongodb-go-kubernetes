import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json());
app.use("/users", userRoutes);

export default app;
