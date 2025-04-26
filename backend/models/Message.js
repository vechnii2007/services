const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
    },
    read: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Виртуальные поля для совместимости с фронтендом
messageSchema.virtual("userId").get(function () {
  return {
    _id: this.senderId,
    name: this.senderName || "Unknown",
  };
});

messageSchema.virtual("text").get(function () {
  return this.message;
});

// Индексы для оптимизации запросов
messageSchema.index({ senderId: 1, recipientId: 1 });
messageSchema.index({ requestId: 1 });
messageSchema.index({ offerId: 1 });
messageSchema.index({ timestamp: -1 });

module.exports = mongoose.model("Message", messageSchema);
