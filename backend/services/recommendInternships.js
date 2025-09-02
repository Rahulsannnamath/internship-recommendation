import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";
import InternshipPosting from "../models/internshipPosting.js";
import { auth } from "../middleware/auth.js";
import express from "express";
const app = express();
app.use(express.json());

const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const BASE_URL = "https://generativelanguage.googleapis.com/v1/models";

// Config
const MAX_INTERNSHIPS = Number(process.env.AI_MAX_INTERNSHIPS || 20);

// --- Robust JSON extraction ---
function robustExtractArray(raw) {
  if (!raw) return null;
  let txt = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/\r/g, "")
    .trim();

  // Remove leading phrases like: "Here is the JSON:" etc.
  txt = txt.replace(/^[^\[\{]*?(?=\[)/s, "");

  // If model wrapped in explanation lines, carve first [ ... ]
  const first = txt.indexOf("[");
  const last = txt.lastIndexOf("]");
  if (first !== -1 && last !== -1 && last > first) {
    txt = txt.slice(first, last + 1);
  }

  // Remove stray trailing commas
  txt = txt
    .replace(/,\s*]/g, "]")
    .replace(/,\s*}/g, "}")
    .trim();

  // Smart quotes
  txt = txt.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // Quick sanity
  if (!/^\s*\[/.test(txt) || !/\]\s*$/.test(txt)) return null;

  try {
    const parsed = JSON.parse(txt);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Try to isolate JSON objects via regex if partially polluted
    const objectMatches = txt.match(/\{[\s\S]*?\}/g);
    if (objectMatches && objectMatches.length) {
      try {
        const salvageArr = `[${objectMatches.join(",")}]`;
        const salvageParsed = JSON.parse(salvageArr);
        if (Array.isArray(salvageParsed)) return salvageParsed;
      } catch {}
    }
  }
  return null;
}

export async function generateRecommendationsForUser(userId) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY env var missing");

  const user = await User.findById(userId).populate("profile");
  if (!user || !user.profile) throw new Error("User profile not found");
  const profile = user.profile;

  if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
    throw new Error("Profile incomplete: add at least one skill");
  }

  const internships = await InternshipPosting.find({})
    .sort({ createdAt: -1 })
    .limit(MAX_INTERNSHIPS)
    .lean();

  if (!internships.length) return [];

  const simplifiedUserProfile = {
    skills: (profile.skills || []).slice(0, 40),
    location: (profile.location || []).slice(0, 10),
    interests: (profile.interests || []).slice(0, 20),
    bio: (profile.bio || "").slice(0, 500)
  };

  const internshipsForPrompt = internships.map(i => ({
    internshipId: i._id.toString(),
    title: i.title,
    company: i.company,
    description: (i.description || "").slice(0, 350),
    skillsRequired: (i.skillsRequired || []).slice(0, 10),
    location: i.location
  }));

  const prompt = `
Respond ONLY with a valid JSON array (UTF-8) and NOTHING else.
Array spec:
[
  {
    "internshipId":"<string exactly as provided>",
    "matchPercentage": <integer 0-100>,
    "justification":"<<=140 chars concise reason>",
    "missingSkills":["skill1","skill2",...]
  },
  ...
]
Rules:
- Include EVERY internship once.
- missingSkills = (skillsRequired - user.skills) case-insensitive. If none use [].
- No additional properties. No explanations. No markdown. No code fences.
UserProfile: ${JSON.stringify(simplifiedUserProfile)}
Internships: ${JSON.stringify(internshipsForPrompt)}
`.trim();

  const url = `${BASE_URL}/${MODEL}:generateContent?key=${encodeURIComponent(API_KEY)}`;

  let apiJson;
  let rawText = "";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          topP: 1,
          topK: 0,
          maxOutputTokens: 1600
        },
        // Safety: (leave default) you can relax if blocking
      })
    });
    apiJson = await res.json();
    if (!res.ok) {
      const errMsg = apiJson?.error?.message || `Gemini API error (${res.status})`;
      throw new Error(errMsg);
    }
    rawText =
      apiJson?.candidates?.[0]?.content?.parts
        ?.map(p => p.text)
        .join("\n")
        .trim() || "";

    if (!rawText) {
      if (apiJson?.promptFeedback?.blockReason) {
        throw new Error(`AI blocked: ${apiJson.promptFeedback.blockReason}`);
      }
      throw new Error("Empty AI response");
    }
  } catch (e) {
    console.error("[AI Request Error]", e, apiJson);
    throw new Error(e.message || "Gemini API call failed");
  }

  const parsed = robustExtractArray(rawText);
  if (!parsed) {
    console.error("[AI Parse Failed] raw snippet:", rawText.slice(0, 600));
    // Optional: return partial debugging if enabled
    if (process.env.AI_DEBUG === "1") {
      return [{
        internship: { id: "debug", title: "DEBUG RAW OUTPUT", company: "", location: "", skillsRequired: [], description: "" },
        matchPercentage: 0,
        justification: "Parser failed; see server logs.",
        missingSkills: []
      }];
    }
    throw new Error("Failed to parse AI response");
  }

  // Map back internships
  const map = Object.fromEntries(internships.map(i => [i._id.toString(), i]));

  const result = parsed
    .filter(o => o && o.internshipId && map[o.internshipId])
    .map(o => {
      const base = map[o.internshipId];
      const pct = Number.isFinite(o.matchPercentage) ? o.matchPercentage : 0;
      const missing = Array.isArray(o.missingSkills)
        ? o.missingSkills.filter(s => typeof s === "string").slice(0, 20)
        : [];
      return {
        internship: {
          id: o.internshipId,
          title: base.title,
          company: base.company,
          location: base.location,
          skillsRequired: base.skillsRequired,
          description: base.description
        },
        matchPercentage: Math.max(0, Math.min(100, pct)),
        justification: (o.justification || "").slice(0, 160),
        missingSkills: missing
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  return result;
}

app.post("/api/ai/recommendations", auth, async (req, res) => {
  try {
    const recs = await generateRecommendationsForUser(req.user._id);
    res.json({ recommendations: recs });
  } catch (e) {
    res.status(400).json({ error: e.message || "Failed to generate recommendations" });
  }
});