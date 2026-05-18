import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import gamificationRoutes from "./routes/gamificationRoutes.js";
import focusRoutes from "./routes/focusRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/focus", focusRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "To|Do Backend Running 🚀",
  });
});

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : "";

if (!mongoUri) {
  console.error("Error: MONGO_URI is not defined in the environment!");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("MongoDB Connected ✅");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });
