const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Схема для хранения информации о просмотрах объявлений
 */
const OfferViewSchema = new Schema({
  // Идентификатор объявления
  offerId: {
    type: Schema.Types.ObjectId,
    ref: "Offer",
    required: true,
    index: true,
  },

  // Идентификатор пользователя (может быть null для анонимных просмотров)
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },

  // IP-адрес (опционально)
  ip: {
    type: String,
  },

  // User-Agent (опционально)
  userAgent: {
    type: String,
  },

  // Реферер (опционально)
  referrer: {
    type: String,
  },

  // Метаданные просмотра (дополнительная информация)
  metadata: {
    type: Object,
    default: {},
  },

  // Метка времени просмотра
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Индекс для быстрого поиска по дате и объявлению
OfferViewSchema.index({ offerId: 1, timestamp: -1 });

// Метод для преобразования в JSON
OfferViewSchema.methods.toJSON = function () {
  const { _id, offerId, userId, timestamp, metadata } = this.toObject();
  return { _id, offerId, userId, timestamp, metadata };
};

// Статический метод для подсчета просмотров объявления за период
OfferViewSchema.statics.countViewsInPeriod = async function (
  offerId,
  startDate,
  endDate
) {
  return this.countDocuments({
    offerId,
    timestamp: { $gte: startDate, $lte: endDate },
  });
};

// Статический метод для получения уникальных просмотров (по пользователям)
OfferViewSchema.statics.countUniqueViewsInPeriod = async function (
  offerId,
  startDate,
  endDate
) {
  return this.aggregate([
    {
      $match: {
        offerId: mongoose.Types.ObjectId(offerId),
        timestamp: { $gte: startDate, $lte: endDate },
        userId: { $ne: null },
      },
    },
    {
      $group: { _id: "$userId" },
    },
    {
      $count: "uniqueViews",
    },
  ]).then((result) => (result.length > 0 ? result[0].uniqueViews : 0));
};

const OfferView = mongoose.model("OfferView", OfferViewSchema);

module.exports = OfferView;
