const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 32,
      match: /^[a-zA-Z0-9_.-]+$/,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    email: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    fullName: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

/* =======================================================
   🔐 Virtuals & Methods
======================================================= */

// Lock flag
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Increase login attempts with auto-lock
userSchema.methods.incLoginAttempts = async function () {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

  // If lock expired → reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME) };
  }

  await this.updateOne(updates);
};

// Reset attempts & update last login
userSchema.methods.resetLoginAttempts = async function () {
  await this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

// Optional helper — serialize safe user data for frontend
userSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    username: this.username,
    role: this.role,
    avatar: this.avatar,
    fullName: this.fullName,
    lastLogin: this.lastLogin,
  };
};

module.exports = mongoose.model("User", userSchema);
