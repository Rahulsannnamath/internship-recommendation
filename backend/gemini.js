import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import mongoose from "mongoose";
import UserProfile from "./models/userProfile.js"; // Correct path to your UserProfile model
import InternshipPosting from "./models/internshipPosting.js"; // Import the InternshipPosting model

// --- SETUP ---
// 1. Load environment variables from .env file
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
// Note: You had this as process.env.URL, I've changed it to the more standard MONGO_URI
const MONGO_URI = process.env.URL; 

// 2. Validate environment variables
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in the .env file");
}
if (!MONGO_URI) {
  throw new Error("MONGO_URI is not set in the .env file");
}

// 3. Initialize the Gemini AI Client
const genAI = new GoogleGenerativeAI(API_KEY);

// --- MAIN FUNCTION ---
async function runRecommendationTest() {
  try {
    // --- 1. CONNECT TO DATABASE ---
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully.");

    // --- 2. FETCH DATA FOR THE PROMPT ---
    console.log("Fetching user profile and internship data from the database...");
    const userProfile = await UserProfile.findOne({ name: "Anjali Rao" }).lean();
    if (!userProfile) {
      console.error("Test user 'Anjali Rao' not found in the database.");
      return;
    }
    const internships = await InternshipPosting.find({}).lean();

    // --- 3. PREPARE DATA & BUILD THE PROMPT ---
    console.log("Building the prompt for Gemini...");
    const simplifiedUserProfile = {
      skills: userProfile.skills,
      location: userProfile.location,
      interests: userProfile.interests,
      bio: userProfile.bio,
    };
    const internshipsForPrompt = internships.map(internship => ({
      internshipId: internship._id.toString(),
      title: internship.title,
      company: internship.company,
      description: internship.description,
      skillsRequired: internship.skillsRequired,
      location: internship.location
    }));

    const prompt = `
      You are an expert AI career advisor. Your task is to analyze a user's profile and recommend the most suitable internships from a provided list. You must evaluate all internships provided.

      For each internship, you must provide:
      1. A match percentage (an integer from 0 to 100).
      2. A brief justification (one sentence) for the match score.
      3. A list of specific skills the user is missing for that role. If no skills are missing, provide an empty list.

      The user's profile is:
      ${JSON.stringify(simplifiedUserProfile, null, 2)}

      The available internship postings are:
      ${JSON.stringify(internshipsForPrompt, null, 2)}

      Respond ONLY with a valid JSON array of objects, following this structure exactly. Do not add any explanatory text, markdown formatting, or anything else before or after the JSON array.
    `;

    // --- 4. CALL GEMINI API ---
    console.log("Sending request to Gemini API...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // --- 5. CLEAN, PARSE, FILTER, AND DISPLAY THE RESPONSE ---
    try {
      // Clean the response to remove any markdown formatting
      const cleanedResponseText = responseText.replace(/```json\n|```/g, "").trim();
      
      // Parse the full response into a JavaScript array
      const allRecommendations = JSON.parse(cleanedResponseText);

      // ** THIS IS THE NEW LOGIC **
      // Filter the array to only include items with a match percentage of 50 or greater
      const filteredRecommendations = allRecommendations.filter(
        (item) => item.matchPercentage >= 50
      );

      console.log("\n--- FILTERED RECOMMENDATIONS (>= 50% Match) ---");
      console.log(JSON.stringify(filteredRecommendations, null, 2));
      console.log(`\n✅ Test successful! Found ${filteredRecommendations.length} relevant internships.`);

    } catch (parseError) {
      console.error("Error parsing or filtering Gemini's response.", parseError);
      console.log("\nRaw response from Gemini:");
      console.log(responseText);
    }

  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    // --- 6. DISCONNECT FROM DATABASE ---
    await mongoose.disconnect();
    console.log("\nMongoDB disconnected.");
  }
}

// --- RUN THE SCRIPT ---
runRecommendationTest();

