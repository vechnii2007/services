const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentMethod: {
      type: String,
      required: false,
    },
    bankDetails: {
      accountNumber: String,
      bankName: String,
      swiftCode: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// Индексы для быстрого поиска
payoutSchema.index({ providerId: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ transactionId: 1 });

module.exports = mongoose.model("Payout", payoutSchema);
