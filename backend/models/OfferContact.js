const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Схема для хранения информации о контактах с авторами объявлений
 */
const OfferContactSchema = new Schema({
  // Идентификатор объявления
  offerId: {
    type: Schema.Types.ObjectId,
    ref: "Offer",
    required: true,
    index: true,
  },

  // Идентификатор пользователя, который инициировал контакт
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },

  // Тип контакта: phone (звонок), message (сообщение), etc.
  type: {
    type: String,
    required: true,
    enum: ["phone", "message", "email", "whatsapp", "telegram", "other"],
    index: true,
  },

  // Результат контакта (если доступен)
  result: {
    type: String,
    enum: ["success", "no_answer", "busy", "error", null],
    default: null,
  },

  // Продолжительность контакта (для звонков) в секундах
  duration: {
    type: Number,
  },

  // IP-адрес (опционально)
  ip: {
    type: String,
  },

  // Метаданные контакта (дополнительная информация)
  metadata: {
    type: Object,
    default: {},
  },

  // Метка времени контакта
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Индекс для быстрого поиска по объявлению, типу и дате
OfferContactSchema.index({ offerId: 1, type: 1, timestamp: -1 });

// Метод для преобразования в JSON
OfferContactSchema.methods.toJSON = function () {
  const { _id, offerId, userId, type, result, duration, timestamp, metadata } =
    this.toObject();
  return { _id, offerId, userId, type, result, duration, timestamp, metadata };
};

// Статический метод для подсчета контактов объявления за период
OfferContactSchema.statics.countContactsInPeriod = async function (
  offerId,
  startDate,
  endDate,
  type = null
) {
  const query = {
    offerId,
    timestamp: { $gte: startDate, $lte: endDate },
  };

  if (type) {
    query.type = type;
  }

  return this.countDocuments(query);
};

// Статический метод для получения статистики контактов по типам
OfferContactSchema.statics.getContactStatsByType = async function (
  offerId,
  startDate,
  endDate
) {
  return this.aggregate([
    {
      $match: {
        offerId: mongoose.Types.ObjectId(offerId),
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        type: "$_id",
        count: 1,
        _id: 0,
      },
    },
  ]);
};

const OfferContact = mongoose.model("OfferContact", OfferContactSchema);

module.exports = OfferContact;
