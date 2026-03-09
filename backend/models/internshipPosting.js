import mongoose from "mongoose";

const internshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
    skillsRequired: {
      type: [String], 
    },
    stipend: {
      type: String, 
    },
    location: {
      type: [String], 
    },
    duration: {
      type: String, // e.g. "3 months"
    },
    deadline: {
      type: Date,
    } }
);

const Internship = mongoose.model("Internship", internshipSchema);

export default Internship;


