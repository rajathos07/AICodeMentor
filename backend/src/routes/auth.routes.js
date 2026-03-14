// backend/src/routes/auth.routes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const validator = require("validator");
const router = express.Router();
const User = require("../models/User");

/* -----------------------------
   Config / Helpers
------------------------------ */
const MIN_PASSWORD_LENGTH = 6;

function normalizeUsername(u = "") {
  return String(u).trim().toLowerCase();
}

function isValidUsername(username) {
  const u = normalizeUsername(username);
  return (
    u.length >= 3 &&
    u.length <= 32 &&
    /^[a-zA-Z0-9_.-]+$/.test(u)
  );
}

function sanitizeInput(str = "") {
  return validator.escape(String(str || "").trim());
}

/* -----------------------------
   Rate limiters
------------------------------ */
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 8,
  message: { success: false, message: "Too many attempts, try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const checkUsernameLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 10,
});

/* -----------------------------
   GET /api/auth/me
------------------------------ */
router.get("/me", (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  }
  return res.json({ loggedIn: false, user: null });
});

/* -----------------------------
   GET /api/auth/session - Check if user has active session
------------------------------ */
router.get("/session", (req, res) => {
  try {
    // Check if user session exists (stored in req.session.user during login)
    if (req.session && req.session.user && req.session.user.id) {
      // User has an active session
      return res.json({
        success: true,
        user: {
          id: req.session.user.id,
          username: req.session.user.username || "User",
          email: req.session.user.email || "",
          name: req.session.user.name || req.session.user.username || "User",
          role: req.session.user.role || "user"
        }
      });
    } else {
      // No active session
      return res.json({
        success: false,
        message: "No active session"
      });
    }
  } catch (err) {
    console.error("Session check error:", err);
    res.status(500).json({
      success: false,
      message: "Error checking session"
    });
  }
});

/* -----------------------------
   POST /api/auth/check-username
   quick availability check used by frontend (debounced)
------------------------------ */
router.post("/check-username", checkUsernameLimiter, async (req, res) => {
  try {
    const raw = String(req.body?.username || "");
    const username = normalizeUsername(raw);
    if (!isValidUsername(username)) {
      return res.json({ ok: false, available: false, message: "Invalid username" });
    }
    const exists = await User.exists({ username });
    return res.json({ ok: true, available: !exists });
  } catch (err) {
    console.error("check-username error:", err);
    return res.status(500).json({ ok: false, available: false, message: "Server error" });
  }
});

/* -----------------------------
   POST /api/auth/register
------------------------------ */
router.post("/register", authLimiter, async (req, res) => {
  try {
    const usernameRaw = sanitizeInput(req.body?.username || "");
    const username = normalizeUsername(usernameRaw);
    const password = String(req.body?.password || "");

    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: "Invalid username (3-32 chars, letters/numbers/.-_ only).",
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Username already taken.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: "user",
    });

    // Optionally auto-login after registration: create session
    req.session.user = {
      id: newUser._id.toString(),
      username: newUser.username,
      role: newUser.role,
    };
    await new Promise((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: req.session.user,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
});

/* -----------------------------
   POST /api/auth/login
------------------------------ */
router.post("/login", authLimiter, async (req, res) => {
  try {
    const usernameRaw = sanitizeInput(req.body?.username || "");
    const username = normalizeUsername(usernameRaw);
    const password = String(req.body?.password || "");
    const remember = !!req.body?.remember;

    if (!isValidUsername(username) || !password) {
      return res.status(400).json({ success: false, message: "Invalid credentials." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    let isMatch = false;

    // Migrate legacy plaintext to bcrypt if necessary
    const looksHashed = typeof user.password === "string" && user.password.startsWith("$2");
    if (!looksHashed) {
      if (user.password === password) {
        isMatch = true;
        const newHash = await bcrypt.hash(password, 12);
        user.password = newHash;
        await user.save();
        console.log(`Migrated legacy password for user '${username}' to bcrypt.`);
      }
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      // increment attempts (if using model methods)
      try { await user.incLoginAttempts(); } catch {}
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    // success => reset attempts (non-blocking)
    try { await user.resetLoginAttempts(); } catch {}

    // create session
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    if (remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    } else {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 4; // keep default 4 hours
    }

    await new Promise((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    user.lastLogin = new Date();
    try { await user.save(); } catch {}

    return res.json({
      success: true,
      user: req.session.user,
      message: "Logged in successfully.",
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});

/* -----------------------------
   POST /api/auth/logout
------------------------------ */
router.post("/logout", (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
          success: false,
          message: "Error logging out"
        });
      }
      res.clearCookie("sessionId"); // matches session name set in app.js
      res.json({
        success: true,
        message: "Logged out successfully"
      });
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({
      success: false,
      message: "Error logging out"
    });
  }
});

module.exports = router;