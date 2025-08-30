import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Configure dotenv to load variables from the .env file
dotenv.config();


const API_KEY = process.env.GEMINI_API_KEY;


if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in the .env file");
}


const genAI = new GoogleGenerativeAI(API_KEY);

async function runRecommendation() {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // This is where you will build your complex internship prompt later.
  // For now, let's test with a simple prompt.
  const prompt = "What are the top 3 skills for a Full Stack Developer Intern in 2025?";

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
  }
}

// Run the function
runRecommendation();