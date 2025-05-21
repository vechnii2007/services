require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Offer = require("../models/Offer");

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Добавить key в категории, если нет
  const categories = await Category.find();
  for (const cat of categories) {
    if (!cat.key) {
      // Простой вариант: key = первый не пустой name (ru/uk/es) в нижнем регистре, без пробелов
      let base =
        cat.name?.ru ||
        cat.name?.uk ||
        cat.name?.es ||
        Object.values(cat.name || {})[0] ||
        "";
      base = String(base);
      if (!base) {
        console.warn(`Category ${cat._id} has no valid name for key!`);
      }
      cat.key = base
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      await cat.save();
      console.log(`Category ${cat._id} assigned key: ${cat.key}`);
    }
  }

  // 2. Обновить serviceType в Offer
  const allCategories = await Category.find();
  const keyByOldName = {};
  for (const cat of allCategories) {
    // Сопоставляем старое строковое имя с новым key
    for (const lang of ["ru", "uk", "es"]) {
      if (cat.name?.[lang]) {
        keyByOldName[cat.name[lang]] = cat.key;
      }
    }
  }

  const offers = await Offer.find();
  for (const offer of offers) {
    // Если serviceType совпадает с каким-либо старым name — обновить на key
    const newKey = keyByOldName[offer.serviceType];
    if (newKey && offer.serviceType !== newKey) {
      offer.serviceType = newKey;
      await offer.save();
      console.log(`Offer ${offer._id} updated serviceType to: ${newKey}`);
    }
  }

  await mongoose.disconnect();
  console.log("Migration complete!");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
