const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer",
  },
  serviceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  location: {
    type: String,
    required: false,
  },
  coordinates: {
    lat: Number,
    lng: Number,
  },
  description: {
    type: String,
    default: "",
  },
  comment: {
    type: String,
    default: "",
  },
  dateTime: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    default: "pending",
  },
  customerConfirmed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
