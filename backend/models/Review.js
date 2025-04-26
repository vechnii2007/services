const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReviewSchema = new Schema(
  {
    // Пользователь, оставивший отзыв
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Предложение, к которому относится отзыв
    offerId: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
      required: true,
    },
    // Тип предложения (Offer, ServiceOffer и т.д.)
    offerType: {
      type: String,
      enum: ["Offer", "ServiceOffer"],
      default: "ServiceOffer",
      required: true,
    },
    // Рейтинг (от 1 до 5)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    // Текст отзыва
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // Статус отзыва
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    // ID поставщика услуг
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Составной индекс, чтобы пользователь мог оставить только один отзыв к предложению
ReviewSchema.index({ userId: 1, offerId: 1 }, { unique: true });

// Статические методы для расчета средней оценки по ID поставщика или предложения
ReviewSchema.statics.getAverageRatingByProvider = async function (providerId) {
  const result = await this.aggregate([
    {
      $match: {
        providerId: new mongoose.Types.ObjectId(providerId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$providerId",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  return result.length > 0
    ? { rating: result[0].avgRating, count: result[0].count }
    : { rating: 0, count: 0 };
};

ReviewSchema.statics.getAverageRatingByOffer = async function (offerId) {
  const result = await this.aggregate([
    {
      $match: {
        offerId: new mongoose.Types.ObjectId(offerId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: "$offerId",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  return result.length > 0
    ? { rating: result[0].avgRating, count: result[0].count }
    : { rating: 0, count: 0 };
};

module.exports = mongoose.model("Review", ReviewSchema);
