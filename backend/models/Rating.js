const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxLength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Составной индекс для предотвращения множественных оценок от одного пользователя
ratingSchema.index({ offerId: 1, userId: 1 }, { unique: true });

// Статический метод для подсчета среднего рейтинга
ratingSchema.statics.calculateAverageRating = async function (offerId) {
  const result = await this.aggregate([
    { $match: { offerId: new mongoose.Types.ObjectId(offerId) } },
    {
      $group: {
        _id: "$offerId",
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);
  return result[0] || { averageRating: 0, totalRatings: 0 };
};

const Rating = mongoose.model("Rating", ratingSchema);

module.exports = Rating;
