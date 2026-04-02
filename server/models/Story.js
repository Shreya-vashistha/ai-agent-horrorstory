import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  prompt: { type: String, required: true, trim: true },
  story: { type: String, required: true, trim: true },
  storyNormalized: { type: String, required: true, index: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Story", storySchema);