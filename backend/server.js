// Load env FIRST (before any other imports that read process.env)
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Internship from "./models/internshipPosting.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import UserProfile from './models/userProfile.js';
import { auth } from './middleware/auth.js';
import { generateRecommendationsForUser } from "./services/recommendInternships.js";
import { chatWithGemini } from "./services/chatGemini.js";

// TEMP DIAGNOSTIC (remove later)
console.log('[BOOT] GEMINI_API_KEY present:', process.env.GEMINI_API_KEY ? 'YES len=' + process.env.GEMINI_API_KEY.trim().length : 'NO');

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

// helper
const sign = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });

app.get("/test", (req, res) => {
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

// AUTH ROUTES
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email & password required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already in use' });
    const hash = await bcrypt.hash(password, 10);
    const profile = await UserProfile.create({});
    const user = await User.create({ email, passwordHash: hash, profile: profile._id });
    const token = sign(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, profile: profile }
    });
  } catch (e) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email }).populate('profile');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = sign(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, profile: user.profile }
    });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      profile: req.user.profile
    }
  });
});

// PROFILE (protected)
app.get('/api/profile', auth, async (req, res) => {
  await req.user.populate('profile');
  res.json(req.user.profile || {});
});

app.put('/api/profile', auth, async (req, res) => {
  try {
    const body = req.body || {};

    // Resolve profile doc (handle populated object vs id)
    let profileId = null;
    if (req.user.profile) {
      profileId = req.user.profile._id ? req.user.profile._id : req.user.profile;
    }

    let profileDoc = profileId ? await UserProfile.findById(profileId) : null;
    if (!profileDoc) {
      profileDoc = new UserProfile({});
      req.user.profile = profileDoc._id;
      await req.user.save();
    }

    // Whitelist fields
    const allowed = [
      'name','email','skills','location','interests','expectedStipend',
      'availableDuration','education','experience','resume','bio',
      'preferredCompanyTypes','availability'
    ];

    // Apply updates
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        profileDoc.set(key, body[key]);
      }
    }

    // Basic trimming for string arrays
    const trimArray = (arr) => Array.isArray(arr) ? arr.map(v => String(v).trim()).filter(Boolean) : [];
    profileDoc.skills = trimArray(profileDoc.skills);
    profileDoc.location = trimArray(profileDoc.location);
    profileDoc.interests = trimArray(profileDoc.interests);
    profileDoc.preferredCompanyTypes = trimArray(profileDoc.preferredCompanyTypes);

    if (profileDoc.bio) profileDoc.bio = String(profileDoc.bio).slice(0, 500);

    await profileDoc.save();

    return res.json({ ok: true, profile: profileDoc });
  } catch (e) {
    console.error('[PROFILE UPDATE ERROR]', e);
    return res.status(500).json({ error: e.message || 'Profile update failed' });
  }
});

app.post("/api/ai/recommendations", auth, async (req, res) => {
  try {
    const recs = await generateRecommendationsForUser(req.user._id);
    res.json({ recommendations: recs });
  } catch (e) {
    res.status(400).json({ error: e.message || "Failed to generate recommendations" });
  }
});

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }

    // Try optional auth (for personalization) without forcing it
    let tokenUserId = null;
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
      try {
        const raw = header.slice(7);
        const decoded = jwt.verify(raw, process.env.JWT_SECRET);
        tokenUserId = decoded.sub;
      } catch {
        // ignore invalid token (treat as anonymous)
      }
    }

    const result = await chatWithGemini({ messages, tokenUserId });
    res.json({ answer: result.answer });
  } catch (e) {
    res.status(400).json({ error: e.message || "Chat failed" });
  }
});

app.get("/devops",(req,res)=>{
res.send("devops test worked");
});

app.get("/test",(req,res)=>{
  res.send("test push");
})

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});