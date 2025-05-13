const mongoose = require("mongoose");

function isValidObjectId(id) {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

module.exports = { isValidObjectId };
