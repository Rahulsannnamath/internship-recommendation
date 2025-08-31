import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Internship from "./models/internshipPosting.js";

const app = express();


app.use(bodyParser.json());
app.use(cors({ origin: "*" }));


dotenv.config();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.URL;

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

// GET all internship postings
app.get("/api/showPostings", async (req, res) => {
  try {
    const postings = await Internship.find().lean();
    res.json({ count: postings.length, data: postings });
  } catch (e) {
    console.error("Fetch postings error:", e);
    res.status(500).json({ error: "Failed to fetch postings" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

app.get("/api/recommendations",  (req,res)=>{
le
});