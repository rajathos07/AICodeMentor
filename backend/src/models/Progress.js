const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  xp: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  completedChallengeIds: { type: [String], default: [] },
});

module.exports = mongoose.model("Progress", progressSchema);
