const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: Map,
    of: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  image: {
    type: String, // URL изображения
    required: true,
  },
});

module.exports = mongoose.model("Category", categorySchema);
