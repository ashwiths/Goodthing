import mongoose from 'mongoose';

let cachedConnection = null;

/**
 * connectDB
 * Cached Mongoose connection middleware optimized for Vercel Serverless Functions.
 * Leverages connection pooling to prevent DB exhaustion.
 */
export const connectDB = async (req, res, next) => {
  const mongoUri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : "";
  if (!mongoUri) {
    console.error("MONGO_URI environment variable is missing!");
    return res.status(500).json({ error: "Database configuration error." });
  }

  // 1. If connection is already fully established, reuse it instantly
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  // 2. If connection is currently opening, wait for its completion promise
  if (mongoose.connection.readyState === 2) {
    try {
      await new Promise((resolve, reject) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', reject);
      });
      return next();
    } catch (err) {
      return res.status(500).json({ error: "Pending database connection failed to resolve." });
    }
  }

  // 3. Otherwise, create a new connection promise and cache it
  try {
    if (!cachedConnection) {
      cachedConnection = mongoose.connect(mongoUri, {
        bufferCommands: false, // Turn off buffer to immediately capture connection timeout issues
      });
    }
    await cachedConnection;
    console.log("MongoDB Connected (Cached Serverless Node) ✅");
    next();
  } catch (error) {
    console.error("MongoDB Serverless Connection Error:", error);
    cachedConnection = null; // Flush cache to retry on the next client hit
    return res.status(500).json({ error: "Database connection failed. Please try again." });
  }
};
