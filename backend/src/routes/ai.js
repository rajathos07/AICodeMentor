// src/routes/ai.js
const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const QUIZ_KEY = process.env.GROQ_QUIZ_API_KEY;
if (!QUIZ_KEY) console.warn("⚠️  GROQ_QUIZ_API_KEY is not set. Add it to your .env");
else console.info("✅ GROQ_QUIZ_API_KEY detected (present).");

const groq = QUIZ_KEY ? new Groq({ apiKey: QUIZ_KEY }) : null;

/* ---------------------------- helpers ---------------------------- */
function stripFences(s = "") {
  return s
    .replace(/^\s*```json\s*/i, "")
    .replace(/^\s*```\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function normalize(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map(q => ({
      ...q,
      code: q.code ?? "",
      difficulty: String(q.difficulty || "easy").toLowerCase(),
    }))
    .filter(q =>
      q.question &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      Number.isInteger(q.answerIndex) &&
      q.answerIndex >= 0 && q.answerIndex < 4 &&
      q.explanation
    );
}

function logGroqError(err) {
  try {
    console.error("❌ Groq error message:", err?.message || err);
    if (err?.response?.data) {
      try { console.error("❌ Groq response data:", JSON.stringify(err.response.data).slice(0, 2000)); } catch { console.error("❌ Groq response data (raw):", err.response.data); }
    } else if (err?.data) {
      try { console.error("❌ Groq data:", JSON.stringify(err.data).slice(0, 2000)); } catch { console.error("❌ Groq data (raw):", err.data); }
    }
  } catch (e) {
    console.error("❌ Error while logging Groq error:", e);
  }
}

/* ---------------------------- core: call provider ---------------------------- */
/**
 * Robustly request `count` questions from the model by issuing one or more
 * smaller requests to avoid token-limit truncation. Each sub-request uses
 * a conservative max_tokens value and we attempt mild retries on parse failure.
 *
 * Returns a normalized array of question objects.
 */
async function callGroqJSONArray({ language, count = 10, difficulties = {}, avoid = [] }) {
  if (!groq) {
    const e = new Error("Server missing GROQ_QUIZ_API_KEY");
    e.code = 401;
    throw e;
  }

  // safety caps to avoid huge single responses
  const MAX_PER_CALL = 4;             // ask up to 4 questions per model call
  const MAX_TOKENS = 1024;           // provider requires <= 1024 for chosen model
  const MODEL = "llama-3.3-70b-versatile"; // keep same model as before

  const batches = [];
  let remaining = Math.max(0, Number(count) || 0);
  while (remaining > 0) {
    const thisCount = Math.min(remaining, MAX_PER_CALL);
    batches.push(thisCount);
    remaining -= thisCount;
  }

  const allResults = [];

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const thisCount = batches[batchIndex];
    const seed = Date.now() + batchIndex;

    const prompt = `You are generating ${thisCount} MULTIPLE-CHOICE questions for the "${language}" programming language.

Distribution (approximate):
- ${difficulties?.easy ?? 0} Easy
- ${difficulties?.medium ?? 0} Medium
- ${difficulties?.hard ?? 0} Hard

STRICT RULES:
- Vary topics and concepts; do NOT repeat earlier ideas in this same response.
- Avoid these exact question texts if present (case-insensitive): ${avoid.length ? JSON.stringify(avoid) : "[]"}
- Questions MUST be about ${language} (syntax, stdlib, semantics). No generic math or non-${language} trivia.
- Each item must have exactly 4 options and one correct answerIndex (0-3).
- If code snippet is not needed, set "code" to "" (empty string).
- Reply ONLY with a JSON array; no prose, no markdown.

OUTPUT SHAPE:
[
  {
    "difficulty": "easy|medium|hard",
    "question": "Clear question text focusing on ${language}",
    "code": "optional snippet or empty string",
    "options": ["A","B","C","D"],
    "answerIndex": 0,
    "explanation": "Why the answer is correct (brief)"
  }
]`;

    // attempt up to 2 parse retries for each batch (in case of minor truncation)
    let attempts = 0;
    let parsedArray = null;
    while (attempts < 2 && parsedArray === null) {
      attempts += 1;
      try {
        console.info(`ℹ️ Groq call: model=${MODEL} language=${language} count=${thisCount} seed=${seed} attempt=${attempts}`);
        const completion = await groq.chat.completions.create({
          model: MODEL,
          messages: [
            { role: "system", content: "Return only a VALID JSON ARRAY. No markdown." },
            { role: "user", content: prompt },
          ],
          temperature: 0.75,
          max_tokens: MAX_TOKENS,
        });

        const raw = completion?.choices?.[0]?.message?.content || "";
        console.info("✅ Groq returned response (preview):", raw.slice(0, 500));

        const text = stripFences(raw);

        // Try to parse directly first
        try {
          parsedArray = JSON.parse(text);
        } catch (errParse) {
          // Try to recover by extracting the first JSON array block
          const m = text.match(/\[[\s\S]*\]/);
          if (m) {
            try {
              parsedArray = JSON.parse(m[0]);
            } catch (err2) {
              // If parse still fails, we set parsedArray=null to retry
              console.warn("⚠️ Failed to parse JSON even after extraction; will retry if attempts left.");
              parsedArray = null;
            }
          } else {
            console.warn("⚠️ No JSON array block found in model output; will retry if attempts left.");
            parsedArray = null;
          }
        }

        // If parsed and is array, push to allResults after normalization step later
        if (Array.isArray(parsedArray)) {
          // push raw parsed for this batch
          allResults.push(...parsedArray);
        } else {
          // if after attempts it's still null, break to outer and throw after loop
          if (attempts >= 2 && parsedArray === null) {
            throw new Error("Model returned invalid or truncated JSON; parsing failed after retries");
          }
        }
      } catch (err) {
        logGroqError(err);
        // If auth error or invalid key, rethrow to let route handler map to 401
        const msg = String(err?.message || err?.response?.data || "");
        if (/unauthorized|invalid.*key|missing.*key|authentication/i.test(msg)) {
          const e = new Error("Invalid or missing GROQ_QUIZ_API_KEY");
          e.code = 401;
          throw e;
        }
        // For other errors, if we have partial results, continue; otherwise throw
        if (allResults.length === 0) {
          // no successful batches yet -> bubble up
          throw err;
        } else {
          // we had earlier successful batch(es); break and return what we have
          console.warn("⚠️ Non-fatal Groq error after some successful batches; returning partial results.", err?.message || err);
          break;
        }
      }
    } // end attempts loop
  } // end batches loop

  // normalize combined results and return
  const normalized = normalize(allResults);
  return normalized;
}

/* ---------------------------- endpoints ---------------------------- */
/** POST /ai/generate-quiz/  -> batch */
async function generateBatch(req, res) {
  try {
    if (!groq) {
      console.error("❌ Attempt to call /ai/generate-quiz without GROQ_QUIZ_API_KEY set");
      return res.status(401).json({ error: "Missing server configuration: GROQ_QUIZ_API_KEY" });
    }

    const { language, count = 10, difficulties = { easy: 4, medium: 4, hard: 2 } } = req.body || {};
    if (!language) return res.status(400).json({ error: "Language is required" });

    // Safety: cap requested count to avoid huge requests
    const requestedCount = Math.min(50, Math.max(1, Number(count) || 10));

    const questions = await callGroqJSONArray({ language, count: requestedCount, difficulties, avoid: [] });

    if (!questions.length) return res.status(502).json({ error: "No questions generated" });

    res.set("Cache-Control", "no-store");
    return res.json({ questions });
  } catch (err) {
    const status = err?.code || err?.status;
    if (status === 401 || /missing.*key|unauthorized|invalid.*key/i.test(err?.message || "")) {
      return res.status(401).json({ error: "Invalid or missing GROQ_QUIZ_API_KEY", message: err?.message || "" });
    }
    console.error("❌ Quiz batch error:", err?.message || err);
    return res.status(500).json({ error: "Failed to generate quiz", message: err?.message || "Unknown error" });
  }
}

/** POST /ai/generate-quiz/one  -> single fresh question
 * Body: { language, avoid?: ["existing question text", ...], difficultyBias?: "easy|medium|hard" }
 */
async function generateOne(req, res) {
  try {
    if (!groq) {
      console.error("❌ Attempt to call /ai/generate-quiz/one without GROQ_QUIZ_API_KEY set");
      return res.status(401).json({ error: "Missing server configuration: GROQ_QUIZ_API_KEY" });
    }

    const { language, avoid = [], difficultyBias } = req.body || {};
    if (!language) return res.status(400).json({ error: "Language is required" });

    const dist = !difficultyBias
      ? { easy: 1, medium: 0, hard: 0 }
      : difficultyBias === "medium" ? { easy: 0, medium: 1, hard: 0 }
      : difficultyBias === "hard" ? { easy: 0, medium: 0, hard: 1 }
      : { easy: 1, medium: 0, hard: 0 };

    const fresh = await callGroqJSONArray({ language, count: 1, difficulties: dist, avoid });
    if (!fresh.length) return res.status(502).json({ error: "No question generated" });

    res.set("Cache-Control", "no-store");
    return res.json({ question: fresh[0] });
  } catch (err) {
    const status = err?.code || err?.status;
    if (status === 401 || /missing.*key|unauthorized|invalid.*key/i.test(err?.message || "")) {
      return res.status(401).json({ error: "Invalid or missing GROQ_QUIZ_API_KEY", message: err?.message || "" });
    }
    console.error("❌ Quiz single error:", err?.message || err);
    return res.status(500).json({ error: "Failed to generate question", message: err?.message || "Unknown error" });
  }
}

/* mount */
router.post("/generate-quiz", generateBatch);
router.post("/generate-quiz/", generateBatch);
router.post("/generate-quiz/one", generateOne);

module.exports = router;