import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    skills: {
      type: [String], // matches skillsRequired in internship
    },
    location: {
      type: [String], // matches location in internship
    },
    interests: {
      type: [String], // areas of interest
    },
    expectedStipend: {
      type: String, // matches stipend format in internship
    },
    availableDuration: {
      type: String, // e.g. "3 months", matches duration in internship
    },
    education: {
      degree: {
        type: String,
      },
      graduationYear: {
        type: Number,
      },
    },
    experience: {
      type: String, 
    },
    resume: {
      type: String, // URL or file path to resume
    },
    bio: {
      type: String, // user description
      maxlength: 500,
    },
    preferredCompanyTypes: {
      type: [String], // e.g. ["Startup", "MNC", "Government"]
    },
    availability: {
      type: String, // e.g. "Immediate", "After 1 month"
    },
  },

);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;