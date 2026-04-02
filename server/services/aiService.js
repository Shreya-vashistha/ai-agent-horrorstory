import Groq from "groq-sdk";

function smartTrim(text, max = 300) {
  if (!text) return "";

  if (text.length <= max) return text;

  // Try to cut at sentence end
  const trimmed = text.slice(0, max);
  const lastPeriod = trimmed.lastIndexOf(".");

  if (lastPeriod > 100) {
    return trimmed.slice(0, lastPeriod + 1);
  }

  // fallback (word-safe trim)
  return trimmed.slice(0, max).split(" ").slice(0, -1).join(" ");
}

export const generateStory = async (prompt, history = []) => {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "system",
          content: `
            You are a horror story generator.

            STRICT RULES:
            - MAX 220 characters ONLY
            - MUST end properly (complete sentence)
            - NEVER exceed limit
            - Make it creepy and unique

            Avoid repeating:
            ${history.slice(0, 5).join("\n")}
                      `,
                    },
        {
          role: "user",
          content: `Write a horror story about: ${prompt}`,
        },
      ],

      temperature: 1.2,

      // TOKEN CONTROL
      max_tokens: 120,
    });

    let story = response.choices[0].message.content.trim();

    // FINAL CONTROL
    story = smartTrim(story, 300);

    return story;

  } catch (error) {
    console.error("AI Error:", error.message);
    return null;
  }
};