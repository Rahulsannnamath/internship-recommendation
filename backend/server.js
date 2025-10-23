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
import Application from './models/Application.js';
import { auth } from './middleware/auth.js';
import { generateRecommendationsForUser } from "./services/recommendInternships.js";
import { chatWithOpenAI } from "./services/chatOpenAI.js";

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

    // Sanitize
    const isValidId = (id) =>
      typeof id === "string" &&
      id.length === 24 &&
      /^[0-9a-fA-F]+$/.test(id);

    const validIds = recs
      .map(r => r.internshipId)
      .filter(isValidId);

    if (validIds.length === 0) {
      return res.json({ recommendations: recs.map(r => ({ ...r, internship: null })) });
    }

    const docs = await Internship.find({ _id: { $in: validIds } }).lean();
    const map = new Map(docs.map(d => [d._id.toString(), d]));

    const enriched = recs.map(r => ({
      ...r,
      internship: isValidId(r.internshipId) ? (map.get(r.internshipId) || null) : null
    }));

    res.json({ recommendations: enriched });
  } catch (e) {
    console.error("[RECOMMENDATIONS ERROR]", e);
    res.status(400).json({ error: e.message || "Failed to generate recommendations" });
  }
});

// Unified chat handler (OpenAI only)
async function handleChat(req, res) {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array required" });
    }
    let tokenUserId = null;
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
      try {
        const raw = header.slice(7);
        const decoded = jwt.verify(raw, process.env.JWT_SECRET);
        tokenUserId = decoded.sub;
      } catch { /* ignore */ }
    }
    const result = await chatWithOpenAI({ messages, tokenUserId });
    return res.json({ answer: result.answer });
  } catch (e) {
    return res.status(400).json({ error: e.message || "Chat failed" });
  }
}

// Replace old Gemini route to use OpenAI
app.post("/api/ai/chat", handleChat);

// (Optional) keep legacy/simple route pointing to same handler
app.post("/api/chat", handleChat);

// APPLICATION ROUTES
// Apply to an internship
app.post("/api/internships/:id/apply", auth, async (req, res) => {
  try {
    const internshipId = req.params.id;
    const { coverLetter, notes } = req.body || {};

    // Validate internship exists
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ error: "Internship not found" });
    }

    // Check if already applied
    const existing = await Application.findOne({
      user: req.user._id,
      internship: internshipId
    });

    if (existing) {
      return res.status(409).json({ 
        error: "Already applied to this internship",
        application: existing
      });
    }

    // Create application
    const application = await Application.create({
      user: req.user._id,
      internship: internshipId,
      coverLetter: coverLetter || "",
      notes: notes || "",
      status: "applied"
    });

    res.json({
      success: true,
      message: "Application submitted successfully",
      application
    });
  } catch (e) {
    console.error("[APPLICATION ERROR]", e);
    res.status(500).json({ error: e.message || "Application failed" });
  }
});

// Get user's applications
app.get("/api/applications", auth, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate("internship")
      .sort({ appliedAt: -1 })
      .lean();
    
    res.json({ applications });
  } catch (e) {
    console.error("[GET APPLICATIONS ERROR]", e);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// Check if user has applied to specific internship
app.get("/api/internships/:id/application-status", auth, async (req, res) => {
  try {
    const application = await Application.findOne({
      user: req.user._id,
      internship: req.params.id
    }).lean();

    res.json({ 
      hasApplied: !!application,
      application: application || null
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to check status" });
  }
});

// Get dashboard statistics
app.get("/api/dashboard/stats", auth, async (req, res) => {
  try {
    // Get user profile for match strength
    await req.user.populate('profile');
    const profile = req.user.profile;
    
    // Count applications by status
    const totalApplications = await Application.countDocuments({ user: req.user._id });
    const acceptedApplications = await Application.countDocuments({ 
      user: req.user._id, 
      status: 'accepted' 
    });
    
    // Calculate match strength based on profile completeness
    let matchStrength = 0;
    if (profile) {
      const hasSkills = (profile.skills || []).length > 0;
      const hasLocation = (profile.location || []).length > 0;
      const hasInterests = (profile.interests || []).length > 0;
      const hasEducation = profile.education?.degree;
      const hasResume = profile.resume;
      const hasBio = profile.bio;
      
      const factors = [hasSkills, hasLocation, hasInterests, hasEducation, hasResume, hasBio];
      const completedFactors = factors.filter(Boolean).length;
      matchStrength = Math.round((completedFactors / factors.length) * 100);
    }

    res.json({
      matchStrength,
      totalApplications,
      acceptedApplications,
      profileCompleteness: matchStrength
    });
  } catch (e) {
    console.error("[DASHBOARD STATS ERROR]", e);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// Get recent applications for dashboard
app.get("/api/dashboard/recent-applications", auth, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate("internship")
      .sort({ appliedAt: -1 })
      .limit(5)
      .lean();
    
    res.json({ applications });
  } catch (e) {
    console.error("[RECENT APPLICATIONS ERROR]", e);
    res.status(500).json({ error: "Failed to fetch recent applications" });
  }
});

// Get top matching internships for dashboard
app.get("/api/dashboard/top-matches", auth, async (req, res) => {
  try {
    await req.user.populate('profile');
    const profile = req.user.profile;
    
    if (!profile || !profile.skills || profile.skills.length === 0) {
      return res.json({ matches: [] });
    }

    const userSkills = profile.skills.map(s => s.toLowerCase());
    const internships = await Internship.find({}).limit(20).lean();
    
    // Calculate match percentage for each internship
    const withMatches = internships.map(internship => {
      const required = (internship.skillsRequired || []).map(s => s.toLowerCase());
      const matched = required.filter(r => userSkills.includes(r));
      const matchPercentage = required.length > 0 
        ? Math.round((matched.length / required.length) * 100)
        : 0;
      
      return {
        ...internship,
        matchPercentage
      };
    });

    // Sort by match percentage and take top 4
    const topMatches = withMatches
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 4);

    res.json({ matches: topMatches });
  } catch (e) {
    console.error("[TOP MATCHES ERROR]", e);
    res.status(500).json({ error: "Failed to fetch top matches" });
  }
});

// Withdraw application
app.delete("/api/applications/:id", auth, async (req, res) => {
  try {
    const applicationId = req.params.id;
    
    const application = await Application.findOne({
      _id: applicationId,
      user: req.user._id
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Update status to withdrawn instead of deleting
    application.status = "withdrawn";
    await application.save();

    res.json({
      success: true,
      message: "Application withdrawn successfully",
      application
    });
  } catch (e) {
    console.error("[WITHDRAW APPLICATION ERROR]", e);
    res.status(500).json({ error: "Failed to withdraw application" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});