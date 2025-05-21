require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const CategoryStats = require("../models/CategoryStats");

async function clearCategoryStats() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await CategoryStats.deleteMany({});
  console.log(`Deleted ${result.deletedCount} category stats`);
  mongoose.disconnect();
}

clearCategoryStats();
