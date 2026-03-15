// src/components/quiz/QuizPanel.jsx
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../patterns/Sidebar";

/* Utils */
function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i-- ) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

function shuffleOptions(options, answerIndex) {
  const pairs = options.map((o, i) => ({ o, i }));
  const s = shuffle(pairs);
  return {
    options: s.map(x => x.o),
    answerIndex: s.findIndex(x => x.i === answerIndex)
  };
}

/**
 * Local sample questions to use as a fallback when the server returns 500 or is unreachable.
 * Keep them small and valid to match the expected question shape.
 */
function getSampleQuestions(lang) {
  // minimal language-specific samples; keep structure identical to actual API
  const common = {
    python: [
      { difficulty: "easy", question: "What is the output of: print(2 + 3 * 4)?", code: "", options: ["20","14","24","None"], answerIndex: 1, explanation: "Multiplication before addition: 3*4=12, plus 2 equals 14." },
      { difficulty: "easy", question: "Which keyword defines a function in Python?", code: "", options: ["func","def","function","fn"], answerIndex: 1, explanation: "The 'def' keyword is used to define functions." },
      { difficulty: "medium", question: "What does list.append(x) do?", code: "", options: ["Insert at index 0","Add x to the end","Replace list","Remove last"], answerIndex: 1, explanation: "append adds the element to the end of the list." }
    ],
    javascript: [
      { difficulty: "easy", question: "Which operator is used for strict equality in JS?", code: "", options: ["=","==","===","!=="], answerIndex: 2, explanation: "=== checks value and type equality." },
      { difficulty: "easy", question: "What is the result of typeof [] in JS?", code: "", options: ["array","object","list","undefined"], answerIndex: 1, explanation: "Arrays are objects in JavaScript; typeof returns 'object'." },
      { difficulty: "medium", question: "Which keyword declares block-scoped variables?", code: "", options: ["var","let","const","both let and const"], answerIndex: 3, explanation: "Both let and const are block-scoped; var is function-scoped." }
    ],
    java: [
      { difficulty: "easy", question: "Which keyword is used to inherit a class in Java?", code: "", options: ["extends","implements","inherits","super"], answerIndex: 0, explanation: "The 'extends' keyword denotes class inheritance." },
      { difficulty: "easy", question: "What package is automatically imported in every Java program?", code: "", options: ["java.lang","java.util","java.core","java.base"], answerIndex: 0, explanation: "java.lang is implicitly imported." },
      { difficulty: "medium", question: "Which method signature is the entry point in Java?", code: "", options: ["public void main()", "public static void main(String[] args)", "static main()", "void main(String[])"], answerIndex: 1, explanation: "The standard entry point is public static void main(String[] args)." }
    ],
    cpp: [
      { difficulty: "easy", question: "Which header is required for std::cout?", code: "", options: ["<stdio.h>","<iostream>","<o>","<cout>"], answerIndex: 1, explanation: "std::cout lives in <iostream>." },
      { difficulty: "easy", question: "Which operator is used to allocate dynamic memory in C++?", code: "", options: ["malloc","new","alloc","create"], answerIndex: 1, explanation: "new allocates objects in C++." },
      { difficulty: "medium", question: "What is the output type of sizeof operator?", code: "", options: ["int","size_t","long","void"], answerIndex: 1, explanation: "sizeof returns size_t." }
    ],
    csharp: [
      { difficulty: "easy", question: "Which keyword is used for declaring namespaces in C#?", code: "", options: ["package","namespace","using","module"], answerIndex: 1, explanation: "The 'namespace' keyword declares namespaces." },
      { difficulty: "easy", question: "Which type holds true/false in C#?", code: "", options: ["int","bool","Boolean","logical"], answerIndex: 1, explanation: "bool is the boolean type in C#." },
      { difficulty: "medium", question: "How do you declare a constant in C#?", code: "", options: ["const int x = 5;","final int x = 5;","static const x = 5;","immutable int x = 5;"], answerIndex: 0, explanation: "Use const to declare compile-time constants." }
    ]
  };

  // default: flatten and return at least a few questions
  const arr = common[lang] || common.javascript;
  // duplicate until we have at least 6 items (UI requests 10 typically but fewer is fine)
  let out = [...arr];
  while (out.length < 6) out = out.concat(arr.map(q => ({ ...q })));
  // ensure unique-ish by slicing
  return out.slice(0, 6).map((q, i) => ({ ...q, question: q.question, id: `sample-${lang}-${i}` }));
}

export default function QuizPanel({ user, onLogout, onSelectNav }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState("python");
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ FIXED: Get API base URL from environment variable
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

  const languages = [
    { value: "python", label: "🐍 Python", color: "from-blue-500 to-yellow-500" },
    { value: "javascript", label: "⚡ JavaScript", color: "from-yellow-400 to-orange-500" },
    { value: "java", label: "☕ Java", color: "from-red-500 to-orange-600" },
    { value: "cpp", label: "⚙️ C++", color: "from-blue-600 to-purple-600" },
    { value: "csharp", label: "💜 C#", color: "from-purple-500 to-pink-500" }
  ];

  const fetchQuestions = async (lang) => {
    setLoading(true);
    setError(null);
    try {
      // ✅ FIXED: Use API_BASE variable instead of hardcoded localhost:3000
      const response = await fetch(`${API_BASE}/ai/generate-quiz/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          language: lang,
          count: 10,
          difficulties: { easy: 4, medium: 4, hard: 2 }
        })
      });

      // If server responded with an error status, handle fallback
      if (!response.ok) {
        // If it's a 500 Internal Server Error, use local sample questions instead of failing hard
        if (response.status === 500) {
          console.warn(`Server returned 500 for /ai/generate-quiz — using local sample questions for "${lang}".`);
          const sample = getSampleQuestions(lang);
          // shuffle options and normalize
          const shuffledQuestions = sample.map(q => {
            const { options, answerIndex } = shuffleOptions(q.options, q.answerIndex || 0);
            return { ...q, options, answerIndex };
          }).filter(Boolean);
          if (shuffledQuestions.length === 0) throw new Error("No valid sample questions available");
          setQuestions(shuffledQuestions);
          setIndex(0);
          setAnswers({});
          setShowResult(false);
          setLoading(false);
          return;
        }
        // For non-500 statuses, throw to be caught below (keeps behavior)
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let quizData = data.questions || data.data || data;

      if (typeof quizData === 'string') {
        try {
          quizData = JSON.parse(quizData);
        } catch (e) {
          console.error("Failed to parse quiz data:", e);
          throw new Error("Invalid quiz data format");
        }
      }

      if (!Array.isArray(quizData)) quizData = quizData.questions || [];

      const shuffledQuestions = quizData.map(q => {
        if (!q.question || !q.options || !Array.isArray(q.options)) {
          console.warn("Invalid question format:", q);
          return null;
        }
        const { options, answerIndex } = shuffleOptions(q.options, q.answerIndex || 0);
        return { ...q, options, answerIndex };
      }).filter(Boolean);

      if (shuffledQuestions.length === 0) {
        throw new Error("No valid questions received from API");
      }

      setQuestions(shuffledQuestions);
      setIndex(0);
      setAnswers({});
      setShowResult(false);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError(err.message || "Failed to fetch questions. Please try again.");
      // Fallback to sample questions on any error
      try {
        const sample = getSampleQuestions(lang);
        const shuffledQuestions = sample.map(q => {
          const { options, answerIndex } = shuffleOptions(q.options, q.answerIndex || 0);
          return { ...q, options, answerIndex };
        }).filter(Boolean);
        setQuestions(shuffledQuestions);
        setIndex(0);
        setAnswers({});
        setShowResult(false);
      } catch {
        setError("Unable to load questions. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: { style: "bg-green-500/20 border-green-500/50 text-green-300", icon: "🟢" },
      medium: { style: "bg-yellow-500/20 border-yellow-500/50 text-yellow-300", icon: "🟡" },
      hard: { style: "bg-red-500/20 border-red-500/50 text-red-300", icon: "🔴" }
    };
    return badges[difficulty] || badges.easy;
  };

  const score = useMemo(() => {
    return Object.keys(answers).reduce((sum, key) => {
      return sum + (answers[key] === questions[key]?.answerIndex ? 1 : 0);
    }, 0);
  }, [answers, questions]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setQuestions([]);
    setIndex(0);
    setAnswers({});
    setShowResult(false);
    setError(null);
  };

  const selectAnswer = (optionIndex) => {
    setAnswers({ ...answers, [index]: optionIndex });
  };

  const next = () => {
    if (index === questions.length - 1) {
      setShowResult(true);
    } else {
      setIndex(index + 1);
    }
  };

  const previous = () => {
    if (index > 0) setIndex(index - 1);
  };

  const restart = () => {
    fetchQuestions(language);
  };

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
                Quiz Master
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
            <AnimatePresence mode="wait">
              {!questions.length ? (
                /* Language Selection Screen */
                <motion.div
                  key="language-select"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-gray-900/90 via-gray-800/50 to-gray-900/90 backdrop-blur-xl shadow-2xl overflow-hidden"
                >
                  <div className="p-12 text-center">
                    <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                      Welcome to Quiz Master
                    </h2>
                    <p className="text-gray-300 mb-10 text-lg">Select a programming language and test your knowledge</p>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                      {languages.map((lang) => (
                        <motion.button
                          key={lang.value}
                          onClick={() => {
                            handleLanguageChange(lang.value);
                            fetchQuestions(lang.value);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={loading}
                          className={`relative p-6 rounded-2xl border-2 transition-all ${
                            language === lang.value
                              ? `border-purple-500 bg-purple-500/20`
                              : "border-white/10 hover:border-white/30 bg-white/5"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="text-3xl mb-2">{lang.label.split(" ")[0]}</div>
                          <div className="text-sm font-semibold">{lang.label.split(" ")[1]}</div>
                        </motion.button>
                      ))}
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300"
                      >
                        {error}
                      </motion.div>
                    )}

                    <motion.button
                      onClick={() => fetchQuestions(language)}
                      disabled={loading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Loading Questions..." : "Start Quiz"}
                    </motion.button>
                  </div>
                </motion.div>
              ) : !showResult ? (
                /* Quiz Screen */
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Progress Bar */}
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span>Question {index + 1} of {questions.length}</span>
                    <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        layoutId="progress"
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((index + 1) / questions.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Question Card */}
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-gray-900/90 via-gray-800/50 to-gray-900/90 backdrop-blur-xl shadow-2xl overflow-hidden"
                  >
                    {/* Question Header */}
                    <div className="p-8 border-b border-purple-500/20 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20">
                      <div className="flex items-start justify-between mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getDifficultyBadge(questions[index]?.difficulty).style}`}>
                          {getDifficultyBadge(questions[index]?.difficulty).icon} {questions[index]?.difficulty}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white">{questions[index]?.question}</h3>
                    </div>

                    {/* Code (if any) */}
                    {questions[index]?.code && (
                      <div className="p-8 bg-black/20 border-b border-purple-500/10">
                        <pre className="text-sm rounded-xl border border-purple-500/20 p-4 overflow-auto bg-black/30">
                          <code className="text-gray-300">{questions[index].code}</code>
                        </pre>
                      </div>
                    )}

                    {/* Options */}
                    <div className="p-8 space-y-3">
                      {questions[index]?.options.map((option, optIndex) => (
                        <motion.button
                          key={optIndex}
                          onClick={() => selectAnswer(optIndex)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            answers[index] === optIndex
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-white/10 hover:border-white/30 bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              answers[index] === optIndex
                                ? "border-purple-500 bg-purple-500"
                                : "border-white/30"
                            }`}>
                              {answers[index] === optIndex && <span className="text-white text-sm">✓</span>}
                            </div>
                            <span className="font-medium">{option}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="p-8 border-t border-purple-500/20 bg-black/20 flex gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={previous}
                        disabled={index === 0}
                        className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
                      >
                        ← Previous
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={next}
                        className="ml-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/30 transition-all font-semibold"
                      >
                        {index === questions.length - 1 ? "Finish Quiz 🏁" : "Next Question →"}
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                /* Results Screen */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-gray-900/90 via-gray-800/50 to-gray-900/90 backdrop-blur-xl shadow-2xl overflow-hidden"
                >
                  {/* Score Header */}
                  <div className="p-8 border-b border-purple-500/20 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.6 }}
                      className="text-7xl mb-4"
                    >
                      {score === questions.length ? "🏆" :
                        score >= questions.length * 0.7 ? "🎉" :
                          score >= questions.length * 0.5 ? "💪" : "📚"}
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-5xl font-black mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                        {score}/{questions.length}
                      </div>
                      <div className="text-xl text-gray-300">
                        {score === questions.length ? "Perfect Score! Outstanding!" :
                          score >= questions.length * 0.7 ? "Excellent Work!" :
                            score >= questions.length * 0.5 ? "Good Effort!" :
                              "Keep Practicing!"}
                      </div>
                      <div className="mt-4 text-sm text-gray-400">
                        You answered {score} out of {questions.length} questions correctly
                      </div>
                    </motion.div>
                  </div>

                  {/* Detailed Results */}
                  <div className="p-8 space-y-4 max-h-[600px] overflow-y-auto">
                    {questions.map((q, qi) => {
                      const correct = answers[qi] === q.answerIndex;
                      const badge = getDifficultyBadge(q.difficulty);
                      
                      return (
                        <motion.div
                          key={qi}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: qi * 0.05 }}
                          className={`p-6 rounded-2xl border-2 ${
                            correct
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-red-500/30 bg-red-500/5"
                          } backdrop-blur-sm`}
                        >
                          {/* Question Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className={`text-2xl ${correct ? "text-emerald-400" : "text-red-400"}`}>
                                {correct ? "✓" : "✗"}
                              </span>
                              <div>
                                <div className="text-sm text-gray-400 mb-1">Question {qi + 1}</div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.style}`}>
                                  {badge.icon} {q.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Question Text */}
                          <div className="font-semibold text-lg mb-3">{q.question}</div>

                          {/* Code */}
                          {q.code && (
                            <pre className="text-xs rounded-xl border border-purple-500/20 p-4 overflow-auto mb-4 bg-black/30">
                              <code className="text-gray-300">{q.code}</code>
                            </pre>
                          )}

                          {/* Answer Info */}
                          <div className="space-y-2 text-sm">
                            {!correct && (
                              <div className="flex items-start gap-2 text-red-300">
                                <span className="font-semibold">Your answer:</span>
                                <span>{q.options[answers[qi]] ?? "Not answered"}</span>
                              </div>
                            )}
                            <div className="flex items-start gap-2 text-emerald-300">
                              <span className="font-semibold">Correct answer:</span>
                              <span>{q.options[q.answerIndex]}</span>
                            </div>
                            <div className="flex items-start gap-2 text-gray-300 bg-black/20 p-3 rounded-lg mt-3">
                              <span className="text-lg">💡</span>
                              <span>{q.explanation}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-8 border-t border-purple-500/20 bg-black/20 flex flex-wrap gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSelectNav?.("editor")}
                      className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium"
                    >
                      ← Back to Code Mentor
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(168, 85, 247, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={restart}
                      className="ml-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all font-semibold"
                    >
                      🔄 Start New Quiz
                    </motion.button>
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
