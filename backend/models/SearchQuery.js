const mongoose = require("mongoose");

const searchQuerySchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
      trim: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    category: {
      type: String,
      ref: "Category",
    },
    lastSearched: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Индексы для быстрого поиска и сортировки
searchQuerySchema.index({ count: -1 });
searchQuerySchema.index({ query: 1 }, { unique: true });

const SearchQuery = mongoose.model("SearchQuery", searchQuerySchema);

module.exports = SearchQuery;
