const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
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
    type: {
      type: String,
      enum: ["TOP", "HIGHLIGHT", "URGENT"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Создаем составной индекс для быстрого поиска активных продвижений
promotionSchema.index({ offerId: 1, type: 1, endDate: 1 });
promotionSchema.index({ userId: 1, endDate: 1 });

// Метод для получения информации о продвижении
promotionSchema.methods.getInfo = function () {
  return {
    id: this._id,
    type: this.type,
    startDate: this.startDate,
    endDate: this.endDate,
    isActive: this.endDate > new Date(),
    daysLeft: Math.max(
      0,
      Math.ceil((this.endDate - new Date()) / (1000 * 60 * 60 * 24))
    ),
  };
};

// Метод для проверки активности продвижения
promotionSchema.methods.isActive = function () {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
};

// Метод для отмены продвижения
promotionSchema.methods.cancel = function () {
  this.endDate = new Date();
  return this.save();
};

// Виртуальное поле для отображения статуса
promotionSchema.virtual("status").get(function () {
  return this.isActive() ? "active" : "expired";
});

// Статический метод для получения активного продвижения предложения
promotionSchema.statics.getActivePromotion = async function (offerId) {
  return this.findOne({
    offerId,
    endDate: { $gt: new Date() },
  });
};

// Виртуальное поле для получения оставшегося времени
promotionSchema.virtual("remainingTime").get(function () {
  const now = new Date();
  return Math.max(0, this.endDate.getTime() - now.getTime());
});

// Преобразование в JSON
promotionSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Promotion = mongoose.model("Promotion", promotionSchema);

module.exports = Promotion;
