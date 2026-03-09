import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  internship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Internship",
    required: true
  },
  status: {
    type: String,
    enum: ["applied", "reviewing", "accepted", "rejected", "withdrawn"],
    default: "applied"
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  coverLetter: {
    type: String,
    default: ""
  },
  notes: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
applicationSchema.index({ user: 1, internship: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);
export default Application;
