// src/components/learning/LearningPanel.jsx
// Enhanced Professional Learning Mode with stunning aesthetics

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "react-simple-code-editor";
import prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import Sidebar from "../patterns/Sidebar";

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
}

// ✅ FIXED: Get API from environment variable with proper fallback
const API = import.meta?.env?.VITE_API_BASE || 'http://localhost:3000';

const LANG_OPTIONS = [
  { value: "python", label: "Python", prism: "python", icon: "🐍" },
];

const TOPIC_ICONS = {
  Loops: "🔄",
  Arrays: "📊",
  Strings: "📝",
  Recursion: "🌀"
};

const DIFFICULTY_CONFIG = {
  easy: { color: "from-green-400 to-emerald-500", bg: "bg-green-500/10", border: "border-green-400/30", glow: "shadow-green-500/20" },
  medium: { color: "from-yellow-400 to-orange-500", bg: "bg-yellow-500/10", border: "border-yellow-400/30", glow: "shadow-yellow-500/20" },
  hard: { color: "from-red-400 to-pink-500", bg: "bg-red-500/10", border: "border-red-400/30", glow: "shadow-red-500/20" }
};

const LS_KEY = (topic, difficulty, language) =>
  `learning_seen_${(topic || "General").toLowerCase()}_${(difficulty || "easy").toLowerCase()}_${(language || "python").toLowerCase()}`;

function loadSeen(topic, difficulty, language) {
  try {
    const s = localStorage.getItem(LS_KEY(topic, difficulty, language));
    return s ? new Set(JSON.parse(s)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(topic, difficulty, language, seenSet) {
  try {
    localStorage.setItem(LS_KEY(topic, difficulty, language), JSON.stringify([...seenSet]));
  } catch {}
}

// SVG Icon Components
const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const ZapIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const PlayIcon = ({ pulsing }) => (
  <svg className={`w-4 h-4 ${pulsing ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function LearningPanel({ user, onLogout }) {
  const [topic, setTopic] = useState("Loops");
  const [difficulty, setDifficulty] = useState("easy");
  const [language, setLanguage] = useState("python");

  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("idle");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [progress, setProgress] = useState({ xp: 0, badges: [] });
  const [awardMsg, setAwardMsg] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  const topics = useMemo(() => ["Loops", "Arrays", "Strings", "Recursion"], []);

  const username = user?.username || user?.name || "guest";

  const [seen, setSeen] = useState(() => loadSeen(topic, difficulty, language));
  useEffect(() => { setSeen(loadSeen(topic, difficulty, language)); }, [topic, difficulty, language]);

  useEffect(() => {
    (async () => {
      try {
        // ✅ FIXED: Use API variable instead of hardcoded URL
        const res = await fetch(`${API}/api/progress/${encodeURIComponent(username)}`);
        const data = await res.json();
        if (data.success && data.progress) {
          setProgress({ xp: data.progress.xp || 0, badges: data.progress.badges || [] });
        }
      } catch {}
    })();
  }, [username]);

  async function fetchChallengeNoRepeat(attempts = 5) {
    setLoading(true); setFeedback(""); setAwardMsg(""); setResults([]); setStatus("idle");
    const excludeIds = [...seen];

    for (let i = 0; i < attempts; i++) {
      try {
        // ✅ FIXED: Use API variable instead of hardcoded URL
        const res = await fetch(`${API}/api/learning/challenge`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`Server ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to fetch challenge");

        const ch = data.challenge;
        setChallenge(ch);
        setCode(ch.starterCode || "");
        saveSeen(topic, difficulty, language, new Set([...seen, ch.id]));
        setSeen(new Set([...seen, ch.id]));
        setLoading(false);
        return;
      } catch (err) {
        if (i === attempts - 1) {
          setFeedback("❌ " + (err?.message || "Could not fetch challenge"));
          setLoading(false);
        }
      }
    }
  }

  async function runTests() {
    if (!challenge || !code.trim()) {
      setFeedback("❌ Please write some code first");
      return;
    }
    setRunning(true);
    setFeedback("");
    setAwardMsg("");
    setResults([]);

    try {
      // ✅ FIXED: Use API variable instead of hardcoded URL
      const res = await fetch(`${API}/api/learning/run-tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          code,
          username,
        }),
      });

      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();

      if (!data.success) {
        setFeedback("❌ " + (data.message || "Test failed"));
        setStatus("failed");
        setRunning(false);
        return;
      }

      setResults(data.results || []);
      if (data.allPassed) {
        setStatus("passed");
        setFeedback("✅ All tests passed! Great job!");
        if (data.xpGained) {
          setAwardMsg(`+${data.xpGained} XP`);
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
        if (data.badge) {
          setAwardMsg(`${awardMsg || ""} 🏅 Badge Unlocked: ${data.badge}`);
        }
      } else {
        setStatus("failed");
        const passedCount = (data.results || []).filter((r) => r.passed).length;
        setFeedback(`❌ ${passedCount}/${data.results?.length || 0} tests passed. Try again!`);
      }
    } catch (err) {
      setFeedback("❌ " + (err?.message || "Error running tests"));
      setStatus("failed");
    } finally {
      setRunning(false);
    }
  }

  const currentLang = LANG_OPTIONS.find((l) => l.value === language)?.prism || "python";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-40 -left-40"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl bottom-0 right-0"></div>
      </div>

      <div className="relative z-10 flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1">
          {/* Header */}
          <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                ☰
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                Learning Master
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">{user?.username || "Guest"}</span>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 text-sm rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Progress & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.div
                className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-blue-400"><ZapIcon /></div>
                  <div>
                    <div className="text-xs text-gray-400">Total XP</div>
                    <div className="text-2xl font-bold text-blue-300">{progress.xp}</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-purple-400"><TrophyIcon /></div>
                  <div>
                    <div className="text-xs text-gray-400">Badges</div>
                    <div className="text-2xl font-bold text-purple-300">{progress.badges.length}</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-emerald-400"><TargetIcon /></div>
                  <div>
                    <div className="text-xs text-gray-400">Challenges Seen</div>
                    <div className="text-2xl font-bold text-emerald-300">{seen.size}</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-white/10 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-white"
                >
                  {topics.map((t) => (
                    <option key={t} value={t}>{TOPIC_ICONS[t]} {t}</option>
                  ))}
                </select>

                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-white"
                >
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                </select>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-white"
                >
                  {LANG_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value}>{l.icon} {l.label}</option>
                  ))}
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchChallengeNoRepeat}
                disabled={loading}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all font-semibold disabled:opacity-50"
              >
                {loading ? "Loading..." : "🎯 New Challenge"}
              </motion.button>
            </div>

            {/* Challenge Section */}
            <AnimatePresence>
              {challenge ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl mb-8"
                >
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-white">{challenge.title}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${DIFFICULTY_CONFIG[difficulty].border}`}>
                        {DIFFICULTY_CONFIG[difficulty].color === "from-green-400 to-emerald-500" && "🟢"}
                        {DIFFICULTY_CONFIG[difficulty].color === "from-yellow-400 to-orange-500" && "🟡"}
                        {DIFFICULTY_CONFIG[difficulty].color === "from-red-400 to-pink-500" && "🔴"}
                        {difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 mb-6">
                    <pre className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap font-mono">
{challenge.prompt}
                    </pre>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CodeIcon />
                      <span className="text-sm font-bold text-slate-300">Your Solution</span>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl">
                      <Editor
                        value={code}
                        onValueChange={setCode}
                        highlight={(input) =>
                          prism.highlight(
                            input,
                            prism.languages[currentLang] || prism.languages.python,
                            currentLang
                          )
                        }
                        padding={20}
                        className="font-mono text-sm leading-7 min-h-[300px]"
                        style={{ outline: "none", background: "transparent" }}
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={runTests}
                    disabled={running || !code.trim()}
                    className="w-full mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg transition-all font-semibold disabled:opacity-50"
                  >
                    {running ? "Running..." : "▶ Run Tests"}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 rounded-3xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-dashed border-white/20 text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 text-slate-600">
                    <SparklesIcon />
                  </div>
                  <p className="text-slate-400 text-lg">Click "New Challenge" to begin your journey</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Section */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-8 rounded-3xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-green-400">
                      <CheckCircleIcon />
                    </div>
                    <h3 className="text-xl font-bold text-white">Test Results</h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="py-3 px-4 text-left text-slate-400 font-semibold">Test</th>
                          <th className="py-3 px-4 text-left text-slate-400 font-semibold">Description</th>
                          <th className="py-3 px-4 text-left text-slate-400 font-semibold">Input</th>
                          <th className="py-3 px-4 text-left text-slate-400 font-semibold">Expected</th>
                          <th className="py-3 px-4 text-left text-slate-400 font-semibold">Output</th>
                          <th className="py-3 px-4 text-center text-slate-400 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, idx) => (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <span className="px-3 py-1.5 rounded-lg bg-slate-800/80 font-mono text-cyan-400">
                                #{r.case ?? idx + 1}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-300">{r.description || "—"}</td>
                            <td className="py-4 px-4">
                              <code className="px-2 py-1 rounded bg-slate-900/60 text-blue-300 text-xs font-mono">
                                {JSON.stringify(r.args)}
                              </code>
                            </td>
                            <td className="py-4 px-4">
                              <code className="px-2 py-1 rounded bg-slate-900/60 text-green-300 text-xs font-mono">
                                {JSON.stringify(r.expected)}
                              </code>
                            </td>
                            <td className="py-4 px-4">
                              {r.error ? (
                                <span className="text-red-400 text-xs">{r.error}</span>
                              ) : (
                                <code className="px-2 py-1 rounded bg-slate-900/60 text-purple-300 text-xs font-mono">
                                  {JSON.stringify(r.output)}
                                </code>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex justify-center">
                                {r.passed ? (
                                  <div className="text-green-400">
                                    <CheckCircleIcon />
                                  </div>
                                ) : (
                                  <div className="text-red-400">
                                    <XCircleIcon />
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feedback Section */}
            <AnimatePresence>
              {(feedback || awardMsg) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-6 rounded-3xl backdrop-blur-xl border shadow-2xl ${
                    status === "passed"
                      ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/30 shadow-green-500/20"
                      : "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-400/30 shadow-yellow-500/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 mt-1 ${status === "passed" ? "text-green-400" : "text-yellow-400"}`}>
                      {status === "passed" ? <CheckCircleIcon /> : <AlertCircleIcon />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-base font-semibold mb-2 ${
                        status === "passed" ? "text-green-300" : "text-yellow-300"
                      }`}>
                        {feedback}
                      </p>
                      {awardMsg && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 mt-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="text-amber-400">
                            <SparklesIcon />
                          </div>
                          <span className="text-sm font-bold text-amber-300">{awardMsg}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
