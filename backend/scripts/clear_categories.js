require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const Category = require("../models/Category");

async function clearCategories() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await Category.deleteMany({});
  console.log(`Deleted ${result.deletedCount} categories`);
  mongoose.disconnect();
}

clearCategories();
