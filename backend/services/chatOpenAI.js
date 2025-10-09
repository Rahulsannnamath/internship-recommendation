import OpenAI from "openai";
import User from "../models/User.js";
import UserProfile from "../models/userProfile.js";

const API_KEY = (process.env.OPENAI_API_KEY || "").trim();
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!API_KEY) {
  console.warn("OPENAI_API_KEY missing (set it in .env)");
}

const openai = new OpenAI({ apiKey: API_KEY });

export async function chatWithOpenAI({ messages, tokenUserId }) {
  if (!API_KEY) throw new Error("OPENAI_API_KEY missing");

  let profileSnippet = "";
  if (tokenUserId) {
    try {
      const user = await User.findById(tokenUserId).populate("profile");
      if (user?.profile) {
        const p = user.profile;
        profileSnippet = `User Profile Context:
Skills: ${(p.skills || []).join(", ") || "None"}
Interests: ${(p.interests || []).join(", ") || "None"}
Locations: ${(p.location || []).join(", ") || "None"}
Bio: ${(p.bio || "").slice(0,180)}`;
      }
    } catch {
      /* ignore */
    }
  }

  const MAX_HISTORY = 12;
  const trimmed = messages.slice(-MAX_HISTORY);

  const systemPrompt = `You are a concise helpful internship & skills assistant.
Return helpful, factual, constructive answers.
If user asks for recommendations and profile data missing, ask them to update it.
Be brief (<= 180 words). Avoid markdown tables unless explicitly requested.
${profileSnippet ? "\n" + profileSnippet : ""}`.trim();

  const openAIMessages = [
    { role: "system", content: systemPrompt },
    ...trimmed.map(m => ({
      role: m.role === "bot" ? "assistant" : "user",
      content: m.text
    }))
  ];

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: MODEL,
      messages: openAIMessages,
      temperature: 0.6,
      top_p: 0.9,
      max_tokens: 512
    });
  } catch (e) {
    throw new Error(e.message || "OpenAI chat failed");
  }

  const text =
    completion?.choices?.[0]?.message?.content?.trim() || "";

  if (!text) throw new Error("Empty response from OpenAI");

  return { answer: text };
}