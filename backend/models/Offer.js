const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["TOP", "HIGHLIGHT", "URGENT"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    price: {
      type: Number,
      required: true,
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
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "INACTIVE", "REJECTED", "COMPLETED"],
      default: "PENDING",
    },
    favoritedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    promotion: {
      type: promotionSchema,
      default: null,
    },
  },
  { timestamps: true }
);

// Миграция старых данных при сохранении
offerSchema.pre("save", function (next) {
  // Если есть старое поле image и оно не в массиве images
  if (this.image && !this.images.includes(this.image)) {
    this.images.push(this.image);
    this.image = undefined; // Удаляем старое поле
  }
  next();
});

// Метод для проверки активности продвижения
offerSchema.methods.isPromotionActive = function () {
  if (!this.promotion) return false;
  const now = new Date();
  return (
    this.promotion.active &&
    this.promotion.startDate <= now &&
    this.promotion.endDate >= now
  );
};

// Виртуальное поле для сортировки
offerSchema.virtual("promotionPriority").get(function () {
  if (!this.isPromotionActive()) return 0;

  switch (this.promotion.type) {
    case "TOP":
      return 3;
    case "HIGHLIGHT":
      return 2;
    case "URGENT":
      return 1;
    default:
      return 0;
  }
});

module.exports = mongoose.model("Offer", offerSchema);
