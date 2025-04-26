const mongoose = require("mongoose");

const promotedSchema = new mongoose.Schema(
  {
    isPromoted: { type: Boolean, default: false },
    promotedUntil: { type: Date, default: null },
    lastPromotedAt: { type: Date },
    promotionType: {
      type: String,
      enum: ["day", "week", "DAY", "WEEK", null],
      default: null,
    },
  },
  { _id: false }
);

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: false,
    },
    serviceType: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    // Добавляем поля для диапазона цен
    isPriceRange: {
      type: Boolean,
      default: false,
    },
    priceFrom: {
      type: Number,
      default: null,
    },
    priceTo: {
      type: Number,
      default: null,
    },
    image: {
      type: String,
      // Устаревшее поле, используйте images вместо него
      deprecated: true,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    favoritedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    promoted: {
      type: promotedSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    // Отключаем валидацию для всех операций обновления
    validateBeforeSave: false,
    validateModifiedOnly: true,
    strict: false,
  }
);

// Отключаем валидацию при обновлении
offerSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany"],
  function (next) {
    this.setOptions({
      runValidators: false,
      validateBeforeSave: false,
      validateModifiedOnly: true,
      strict: false,
    });
    next();
  }
);

// Middleware для автоматического копирования serviceType в category
offerSchema.pre("save", function (next) {
  if (this.serviceType && !this.category) {
    this.category = this.serviceType;
  }

  // Если есть поле image и оно не пустое, но нет images, добавляем image в images
  if (this.image && !this.images.length) {
    this.images = [this.image];
  }

  next();
});

// Индекс для быстрого поиска поднятых объявлений
offerSchema.index({ "promoted.promotedUntil": -1 });

const OfferModel = mongoose.model("Offer", offerSchema);

// Отключаем валидацию на уровне модели
OfferModel.schema.options.runValidators = false;
OfferModel.schema.options.validateBeforeSave = false;
OfferModel.schema.options.validateModifiedOnly = true;
OfferModel.schema.options.strict = false;

module.exports = OfferModel;
