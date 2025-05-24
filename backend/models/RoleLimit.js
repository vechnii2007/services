const mongoose = require("mongoose");

const RoleLimitSchema = new mongoose.Schema({
  role: { type: String, enum: ["provider", "user"], required: true },
  type: { type: String, enum: ["free", "premium"], required: true },
  limits: {
    maxActiveOffers: { type: Number, default: 3 },
    maxTopOffers: { type: Number, default: 1 },
    maxActiveRequests: { type: Number, default: 3 },
    analytics: { type: Boolean, default: false },
    premiumBadge: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    // ... другие опции по необходимости
  },
  description: String,
});

module.exports = mongoose.model("RoleLimit", RoleLimitSchema);
