import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/internshipDB";

// MongoDB Connection
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (e) {
    console.error("❌ MongoDB connection error:", e);
  }
}

connectDB();


app.get("/", (req, res) => {
  res.send("server is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
