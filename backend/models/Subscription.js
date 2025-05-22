const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tariffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tariff",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "pending"],
      default: "pending",
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    lastPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: false,
    },
    cancelReason: {
      type: String,
      required: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Индексы для быстрого поиска
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });
subscriptionSchema.index({ tariffId: 1 });

// Виртуальное поле для проверки активности
subscriptionSchema.virtual("isActive").get(function () {
  return this.status === "active" && this.endDate > new Date();
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
