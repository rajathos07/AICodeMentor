// backend/src/app.js — Unified Express API (port 3000)
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* ========= Middleware ========= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/* ========= CORS Setup ========= */
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ai-code-mentor.vercel.app",
];

// Add FRONTEND_URL if it's set
if (FRONTEND_URL && !allowedOrigins.includes(FRONTEND_URL)) {
  allowedOrigins.push(FRONTEND_URL);
}

// Allow ALL Vercel preview deployment URLs for this project
const allowedOriginPatterns = [
  /^https:\/\/ai-code-mentor(-[a-z0-9]+)*\.vercel\.app$/, // Matches all preview + production
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const cleanOrigin = origin.replace(/\/$/, "");
      
      const isAllowed =
        allowedOrigins.includes(cleanOrigin) ||
        allowedOriginPatterns.some((pattern) => pattern.test(cleanOrigin));

      if (isAllowed) {
        callback(null, true);
      } else {
        console.error("❌ CORS blocked origin:", cleanOrigin);
        console.log("✅ Allowed origins:", allowedOrigins);
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

/* Handle preflight requests */
app.options("*", cors());

/* ========= Database ========= */
const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/agentic-coding";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* ========= Config ========= */
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error("❌ SESSION_SECRET env var is not set. App will not start.");
  process.exit(1);
}

const NODE_ENV = process.env.NODE_ENV || "development";

/* ========= Security Middlewares ========= */
let helmet, rateLimit;
try {
  helmet = require("helmet");
} catch {
  helmet = null;
  console.warn("⚠️ helmet not installed — skipping");
}

try {
  rateLimit = require("express-rate-limit");
} catch {
  rateLimit = null;
  console.warn("⚠️ express-rate-limit not installed — skipping");
}

/* Render runs behind proxy */
if (NODE_ENV === "production") app.set("trust proxy", 1);

if (helmet) app.use(helmet());

if (rateLimit) {
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", globalLimiter);
  app.use("/ai/", globalLimiter);
}

/* ========= Session ========= */
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    name: "sessionId",

    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      touchAfter: 24 * 3600,
      crypto: { secret: SESSION_SECRET },
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
      autoRemove: "native",
    }),

    cookie: {
      secure: NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 4,

      /* Important for Vercel → Render cross-site cookies */
      sameSite: NODE_ENV === "production" ? "none" : "lax",

      domain:
        NODE_ENV === "production"
          ? process.env.COOKIE_DOMAIN
          : undefined,
    },
  })
);

/* ========= Routes ========= */

// AUTH ROUTES
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);
console.log("   ✅ Auth routes loaded");

// ACTIVITY
const activityRoutes = require("./routes/activity.routes");
app.use("/api/activity", activityRoutes);
console.log("   ✅ Activity routes loaded");

// AI ROUTES
app.use("/ai", require("./routes/ai.routes"));
app.use("/ai", require("./routes/ai"));
app.use("/ai", require("./routes/groq.routes"));
console.log("   ✅ AI routes (review + quiz + Groq) loaded");

// PROGRESS
const progressRoutes = require("./routes/progress.routes");
app.use("/api/progress", progressRoutes);
console.log("   ✅ Progress routes loaded");

// LEARNING PANEL
app.use("/api/learning", require("./routes/learning.routes"));

/* ========= Health Check ========= */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    port: process.env.PORT || 3000,
    mongodb:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

/* ========= 404 + Error Handling ========= */
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(NODE_ENV === "development" && { stack: err.stack }),
  });
});

/* ========= Export ========= */
module.exports = app;
