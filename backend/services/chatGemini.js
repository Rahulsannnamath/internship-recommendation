import User from "../models/User.js";
import UserProfile from "../models/userProfile.js";

const MODEL = process.env.GEMINI_CHAT_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash";
const API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const BASE_URL = "https://generativelanguage.googleapis.com/v1/models";

// Build Gemini contents from messages
function toGeminiContents(messages, systemPrompt) {
  const parts = [];
  if (systemPrompt) {
    parts.push({ role: "user", parts: [{ text: systemPrompt }] });
  }
  return [
    ...parts,
    ...messages.map(m => ({
      role: m.role === "bot" ? "model" : "user",
      parts: [{ text: m.text }]
    }))
  ];
}

export async function chatWithGemini({ messages, tokenUserId }) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY missing");

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
      // silent
    }
  }

  // Keep only last N messages to control prompt size
  const MAX_HISTORY = 12;
  const trimmed = messages.slice(-MAX_HISTORY);

  const systemPrompt = `You are a concise helpful internship & skills assistant.
Return helpful, factual, constructive answers.
If asked for recommendations, you may ask the user to update their profile or use the AI Recommendations feature.
Be brief (<= 180 words). Avoid markdown tables unless explicitly requested.
${profileSnippet ? "\n" + profileSnippet : ""}`;

  const contents = toGeminiContents(trimmed, systemPrompt);

  const url = `${BASE_URL}/${MODEL}:generateContent?key=${encodeURIComponent(API_KEY)}`;

  let apiJson;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.6,
          topP: 0.9,
          maxOutputTokens: 512
        }
      })
    });
    apiJson = await res.json();
    if (!res.ok) {
      const errMsg = apiJson?.error?.message || `Gemini chat error (${res.status})`;
      throw new Error(errMsg);
    }
  } catch (e) {
    throw new Error(e.message || "Gemini chat failed");
  }

  const text =
    apiJson?.candidates?.[0]?.content?.parts
      ?.map(p => p.text)
      .join("\n")
      .trim() || "";

  if (!text) {
    if (apiJson?.promptFeedback?.blockReason) {
      throw new Error(`Response blocked: ${apiJson.promptFeedback.blockReason}`);
    }
    throw new Error("Empty response");
  }

  return { answer: text };
}