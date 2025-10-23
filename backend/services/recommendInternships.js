
import OpenAI from "openai";
import User from "../models/User.js";
import InternshipPosting from "../models/internshipPosting.js";
import { auth } from "../middleware/auth.js";
import express from "express";
const app = express();
app.use(express.json());

// CLEAN CONSTANTS
const OPENAI_KEY = (process.env.OPENAI_API_KEY || process.env.OPEN_AI_API || "").trim();
const OPENAI_MODEL = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
const MAX_INTERNSHIPS = Number(process.env.AI_MAX_INTERNSHIPS || 20);

if (!OPENAI_KEY) {
  console.warn("[AI INIT] OPENAI key missing. Will fallback to local scoring.");
}

const openai = new OpenAI({ apiKey: OPENAI_KEY });

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

  const slimProfile = {
    skills: (profile.skills || []).slice(0, 40),
    location: (profile.location || []).slice(0, 10),
    interests: (profile.interests || []).slice(0, 20),
    bio: (profile.bio || "").slice(0, 500)
  };

  const slimInternships = internships.map((i, idx) => ({
    index: idx,
    internshipId: i._id.toString(),
    title: i.title,
    company: i.company,
    description: (i.description || "").slice(0, 200),
    skillsRequired: (i.skillsRequired || []).slice(0, 10),
    location: i.location
  }));

  const prompt = `You are ranking internships for a user.

RULES:
- Use ONLY the provided "index" field to reference internships.
- NEVER fabricate, truncate, or create IDs.
- Output ONLY pure JSON (array), no code fences, no extra text.
- Max 15 items, sorted by matchPercentage desc.
- Be concise in reasons (<= 12 words each).

User Profile: ${JSON.stringify(slimProfile)}

Internships (array of objects with index):
${JSON.stringify(slimInternships)}

Return JSON array like:
[
  {
    "index": 0,
    "matchPercentage": 78,
    "reasons": ["matches React", "location aligns"],
    "skillMatches": ["react","node"],
    "missingSkills": ["docker"]
  }
]`;

  let parsed;
  try {
    if (!OPENAI_KEY) throw new Error("No OpenAI key");
    const systemMsg = "Return ONLY a JSON array as specified. No prose.";
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: prompt }
      ],
      temperature: 0.25,
      max_tokens: 900
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "";
    try {
      parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Not array");
    } catch {
      parsed = robustExtractArray(raw);
      if (!parsed) throw new Error("Parse failed");
    }
  } catch (e) {
    console.error("[AI Parse Fallback]", e.message);
    // Local fallback: build deterministic scores
    parsed = slimInternships.map(si => {
      const required = (si.skillsRequired || []).map(s => s.toLowerCase());
      const have = (slimProfile.skills || []).map(s => s.toLowerCase());
      const skillMatches = required.filter(r => have.includes(r));
      const missingSkills = required.filter(r => !have.includes(r));
      const matchPercentage = required.length
        ? Math.round((skillMatches.length / required.length) * 100)
        : 30;
      return {
        index: si.index,
        matchPercentage,
        reasons: ["Fallback local scoring"],
        skillMatches,
        missingSkills
      };
    });
  }

  // Map indexes -> real internshipIds, drop invalid
  const recs = (Array.isArray(parsed) ? parsed : [])
    .filter(r =>
      r &&
      Number.isInteger(r.index) &&
      r.index >= 0 &&
      r.index < slimInternships.length &&
      typeof r.matchPercentage === "number"
    )
    .map(r => {
      const base = slimInternships[r.index];
      return {
        internshipId: base.internshipId,
        matchPercentage: Math.max(0, Math.min(100, r.matchPercentage)),
        reasons: Array.isArray(r.reasons) ? r.reasons.slice(0, 5) : [],
        skillMatches: Array.isArray(r.skillMatches) ? r.skillMatches.slice(0, 10) : [],
        missingSkills: Array.isArray(r.missingSkills) ? r.missingSkills.slice(0, 10) : []
      };
    })
    .filter((v, idx, arr) =>
      v &&
      /^[0-9a-fA-F]{24}$/.test(v.internshipId) &&
      arr.findIndex(x => x.internshipId === v.internshipId) === idx
    )
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 15);

  return recs;
}
