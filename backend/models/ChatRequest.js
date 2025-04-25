const mongoose = require("mongoose");

const chatRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceOffer",
    },
    service: {
      title: String,
      type: String,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "completed", "cancelled"],
      default: "pending",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Индексы для оптимизации запросов
chatRequestSchema.index({ userId: 1 });
chatRequestSchema.index({ providerId: 1 });
chatRequestSchema.index({ offerId: 1 });
chatRequestSchema.index({ serviceId: 1 });
chatRequestSchema.index({ status: 1 });
chatRequestSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("ChatRequest", chatRequestSchema);
