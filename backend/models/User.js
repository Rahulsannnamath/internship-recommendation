import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile' }
  },
);

export default mongoose.model('User', userSchema);