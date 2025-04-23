const mongoose = require("mongoose");

const categoryStatsSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    last_full_sync: {
      type: Date,
      default: Date.now,
    },
    last_incremental_update: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CategoryStats", categoryStatsSchema);
