// src/routes/quiz.routes.js
const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

// Use a dedicated key for the single-question quiz API
// Add GROQ_SINGLE_QUIZ_API_KEY=gsk_... in your .env
const SINGLE_KEY = process.env.GROQ_SINGLE_QUIZ_API_KEY;

if (!SINGLE_KEY) {
  console.warn("⚠️  GROQ_SINGLE_QUIZ_API_KEY is not set. Add it to your .env");
}
const groq = new Groq({ apiKey: SINGLE_KEY });

// Store questions temporarily (in production, use Redis or DB)
const questionStore = new Map();

// Generate a single question
router.post("/generate", async (req, res) => {
  try {
    const { language = "python", difficulty = "easy" } = req.body || {};

    if (!SINGLE_KEY) {
      return res.status(401).json({ error: "Missing GROQ_SINGLE_QUIZ_API_KEY" });
    }

    const prompt = `Generate ONE multiple-choice programming question about ${language}.
Difficulty: ${difficulty}

Return ONLY a valid JSON object (no prose, no markdown) with exactly:
{
  "question": "Clear question text",
  "code": "code snippet here (use empty string if not needed)",
  "options": ["option A", "option B", "option C", "option D"],
  "answerIndex": 0,
  "explanation": "Brief explanation of the correct answer"
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // fast + free-tier friendly (or use llama-3.1-70b-versatile)
      messages: [
        { role: "system", content: "Return only VALID JSON. No markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 900,
    });

    let text = (completion.choices?.[0]?.message?.content || "").trim();
    // Strip any accidental code fences
    text = text
      .replace(/^\s*```json\s*/i, "")
      .replace(/^\s*```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    // Parse JSON, with a fallback to the first {...} block
    let questionData;
    try {
      questionData = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error("❌ Groq returned non-JSON:", text.slice(0, 300));
        return res.status(500).json({ error: "Model returned invalid JSON. Please retry." });
      }
      questionData = JSON.parse(match[0]);
    }

    // Validate structure
    if (
      !questionData?.question ||
      !Array.isArray(questionData.options) ||
      questionData.options.length !== 4 ||
      typeof questionData.answerIndex !== "number" ||
      questionData.answerIndex < 0 ||
      questionData.answerIndex > 3
    ) {
      return res.status(500).json({ error: "Invalid question format from model" });
    }

    // Unique ID + store with answer for later verification
    const id = Date.now() + "_" + Math.random().toString(36).slice(2, 11);
    questionStore.set(id, { ...questionData, timestamp: Date.now() });

    // Clean up old entries (older than 1 hour)
    const cutoff = Date.now() - 3600_000;
    for (const [key, val] of questionStore.entries()) {
      if (val.timestamp < cutoff) questionStore.delete(key);
    }

    // Return question WITHOUT the answerIndex
    res.json({
      data: {
        id,
        question: questionData.question,
        code: questionData.code || "",
        options: questionData.options,
      },
    });
  } catch (error) {
    const status = error?.status || error?.code;
    if (status === 401 || /unauthorized|invalid.*key/i.test(error?.message || "")) {
      return res.status(401).json({ error: "Invalid or missing GROQ_SINGLE_QUIZ_API_KEY" });
    }
    console.error("❌ Error generating single question (Groq):", error);
    res.status(500).json({ error: "Failed to generate question", message: error?.message || "Unknown error" });
  }
});

// Submit answer and get feedback
router.post("/submit", async (req, res) => {
  try {
    const { id, choiceIndex } = req.body || {};

    if (!id || typeof choiceIndex !== "number") {
      return res.status(400).json({ error: "Invalid submission" });
    }

    const stored = questionStore.get(id);
    if (!stored) {
      return res.status(404).json({ error: "Question not found or expired" });
    }

    const correct = choiceIndex === stored.answerIndex;

    res.json({
      data: {
        correct,
        answerIndex: stored.answerIndex,
        explanation: stored.explanation,
      },
    });
  } catch (error) {
    console.error("❌ Error submitting answer:", error);
    res.status(500).json({ error: "Failed to submit answer", message: error?.message || "Unknown error" });
  }
});

module.exports = router;
