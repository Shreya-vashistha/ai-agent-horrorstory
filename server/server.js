import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { generateStory } from "./services/aiService.js";
import Story from "./models/Story.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

// Normalize text (for similarity / storage)
function normalizeStory(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// Lightweight similarity check (production-friendly)
function similarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(" "));
  const wordsB = new Set(b.toLowerCase().split(" "));

  const intersection = [...wordsA].filter((word) =>
    wordsB.has(word)
  );

  return intersection.length / Math.max(wordsA.size, wordsB.size);
}

// Health route
app.get("/", (req, res) => {
  res.send("Horror Story API is running...");
});


// MAIN API (PRODUCTION LOGIC)
app.post("/api/story/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Get last 10 stories (light history)
    const recent = await Story.find({}, { story: 1 })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const history = recent.map((d) => d.story);

    let story = null;
    let attempts = 0;

    // Controlled retry (NOT excessive)
    while (attempts < 5) {
      story = await generateStory(prompt, history);

      if (!story) {
        attempts++;
        continue;
    }
      //HARD LIMIT
      if (story.length > 300) {
        story = story.slice(0, 300);
      }

      //similarity check
      const isSimilar = history.some((h) =>
        similarity(h, story) > 0.8
      );

      if (!isSimilar) break;

      attempts++;
    }

    // FINAL FALLBACK (NEVER FAIL)
    if (!story) {
      story = "The lights went out… but something kept breathing behind me.";
    }

    //Save story (no crash even if duplicate)
    await Story.create({
      prompt,
      story,
      storyNormalized: normalizeStory(story),
    });

    res.json({ story });

  } catch (error) {
    console.error("Server Error:", error.message);

    //Always return something (important for frontend)
    res.json({
      story: "I heard footsteps… but I live alone.",
    });
  }
});


// GET HISTORY API
app.get("/api/story/history", async (req, res) => {
  try {
    const stories = await Story.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});


// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});