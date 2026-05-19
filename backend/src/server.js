import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { sanitizeRequest } from "./middleware/sanitize.js";
import { connectDB } from "./middleware/connectDb.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import gamificationRoutes from "./routes/gamificationRoutes.js";
import focusRoutes from "./routes/focusRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";


dotenv.config();

// ─── Process Global Rejection Shields ───
process.on("unhandledRejection", (reason, promise) => {
  console.error("🔴 Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("🔴 Uncaught Exception thrown:", error);
});

const app = express();

// ─── HTTP Header Security (Helmet) ───
app.use(helmet());

// ─── Global Request Throttling Rate Limiting ───
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP. Please try again after 15 minutes."
  }
});

// ─── Stricter Throttling for Sensitive Auth endpoints ───
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login/signup attempts. Please try again after 15 minutes."
  }
});

app.use(cors());
app.use(express.json());

// ─── Shield Requests against NoSQL Query Injections ───
app.use(sanitizeRequest);

// ─── Healthcheck Root Route (Does not require DB connection) ───
app.get("/", (req, res) => {
  res.json({
    message: "To|Do Backend Running 🚀",
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    status: "online",
    message: "ZenForge Backend Running 🚀",
    timestamp: new Date().toISOString(),
  });
});

// ─── Bind Rate Limiters ───
app.use("/api", globalLimiter);
app.use("/api/auth", authLimiter);

// ─── Connect to Database on-demand (Serverless Mongoose Optimization) ───
app.use(connectDB);

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/analytics", analyticsRoutes);


// ─── Express Global Crash Shield Middleware ───
app.use((err, req, res, next) => {
  console.error("🔴 Express Error Shielded:", err);
  res.status(err.status || 500).json({
    error: "An unexpected server error occurred. Please try again later.",
    ...(process.env.NODE_ENV === "development" ? { detail: err.message } : {}),
  });
});

const PORT = process.env.PORT || 5000;

// ─── Process-Agnostic Boot (Local Dev vs Serverless Vercel) ───
if (!process.env.VERCEL) {
  const mongoUri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : "";
  if (!mongoUri) {
    console.error("Error: MONGO_URI is not defined in the environment!");
    process.exit(1);
  }

  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("MongoDB Connected Locally ✅");

      app.listen(PORT, () => {
        console.log(`Local Server running on port ${PORT} 🚀`);
      });
    })
    .catch((err) => {
      console.log("MongoDB connection error:", err);
    });
}

export default app;
