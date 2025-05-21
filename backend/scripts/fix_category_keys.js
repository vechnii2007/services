require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const Category = require("../models/Category");

async function fixKeys() {
  await mongoose.connect(process.env.MONGODB_URI);

  const categories = await Category.find();
  for (const cat of categories) {
    let base = "";
    if (cat.name && typeof cat.name === "object" && !Array.isArray(cat.name)) {
      base =
        cat.name.ru ||
        cat.name.uk ||
        cat.name.es ||
        Object.values(cat.name || {})[0] ||
        "";
    }
    base = String(base)
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    // Если key невалидный или base пустой — удаляем категорию
    if (typeof cat.key !== "string" || !/^[a-z0-9_]+$/.test(cat.key) || !base) {
      await cat.deleteOne();
      console.log(`Deleted broken category ${cat._id}`);
    } else if (cat.key !== base) {
      cat.key = base;
      await cat.save();
      console.log(`Fixed key for category ${cat._id}: ${cat.key}`);
    }
  }
  mongoose.disconnect();
}

fixKeys();
