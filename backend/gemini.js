import dotenv from "dotenv";
import mongoose from "mongoose";
import OpenAI from "openai";
import UserProfile from "./models/userProfile.js";
import InternshipPosting from "./models/internshipPosting.js";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MONGO_URI = process.env.URL;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
if (!MONGO_URI) throw new Error("MONGO_URI missing");

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function runRecommendationTest() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected.");

    console.log("Fetching data...");
    const userProfile = await UserProfile.findOne({ name: "Anjali Rao" }).lean();
    if (!userProfile) {
      console.error("User not found");
      return;
    }
    const internships = await InternshipPosting.find({}).lean();

    const simplifiedUserProfile = {
      skills: userProfile.skills,
      location: userProfile.location,
      interests: userProfile.interests,
      bio: userProfile.bio
    };

    const internshipsForPrompt = internships.map(i => ({
      id: i._id,
      title: i.title,
      company: i.company,
      location: i.location,
      skillsRequired: i.skillsRequired,
      description: i.description
    }));

    const prompt = `You are an assistant ranking internships.
User Profile: ${JSON.stringify(simplifiedUserProfile)}
Internships: ${JSON.stringify(internshipsForPrompt)}
Return ONLY a JSON array. Each item:
{
  "internshipId": "<id>",
  "title": "<title>",
  "matchPercentage": <0-100>,
  "reasons": ["...","..."],
  "skillMatches": ["..."],
  "missingSkills": ["..."]
}
Sort by matchPercentage desc.`;

    console.log("Calling OpenAI...");
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You produce strict JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let arr;
    try {
      arr = JSON.parse(cleaned);
    } catch (e) {
      console.error("Parse error. Raw response:\n", raw);
      return;
    }

    const filtered = arr.filter(x => x.matchPercentage >= 50);
    console.log("Filtered (>=50%):");
    console.log(JSON.stringify(filtered, null, 2));
    console.log(`✅ Found ${filtered.length} relevant internships.`);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

runRecommendationTest();

