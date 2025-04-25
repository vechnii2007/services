const mongoose = require("mongoose");

const offerPromotionSchema = new mongoose.Schema(
  {
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
      index: true,
    },
    isPromoted: {
      type: Boolean,
      default: true,
    },
    promotedUntil: {
      type: Date,
      required: true,
    },
    lastPromotedAt: {
      type: Date,
      default: Date.now,
    },
    promotionType: {
      type: String,
      enum: ["DAY", "WEEK"],
      required: true,
    },
  },
  { timestamps: true }
);

// Создаем уникальный индекс по offerId, чтобы для каждого предложения был только один промо-статус
offerPromotionSchema.index({ offerId: 1 }, { unique: true });

module.exports = mongoose.model("OfferPromotion", offerPromotionSchema);
