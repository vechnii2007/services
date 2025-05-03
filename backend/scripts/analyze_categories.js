const mongoose = require("mongoose");
require("dotenv").config();

const Category = require("../models/Category");
const Offer = require("../models/Offer");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // 1. Все категории
  const categories = await Category.find({}, { name: 1, label: 1, _id: 0 });
  const categoryNames = categories.map((cat) => cat.name);
  console.log("Категории в базе:");
  categories.forEach((cat) => {
    console.log(`- ${cat.name} (${cat.label})`);
  });

  // 2. Все уникальные serviceType в предложениях
  const uniqueServiceTypes = await Offer.distinct("serviceType");
  console.log("\nУникальные serviceType в предложениях:");
  uniqueServiceTypes.forEach((type) => console.log(`- ${type}`));

  // 3. Количество предложений по каждой категории
  console.log("\nКоличество предложений по каждой категории:");
  for (const cat of categories) {
    const count = await Offer.countDocuments({ serviceType: cat.name });
    console.log(`- ${cat.name} (${cat.label}): ${count}`);
  }

  // 4. Предложения с несуществующими категориями
  const orphanOffers = await Offer.find(
    { serviceType: { $nin: categoryNames } },
    { title: 1, serviceType: 1 }
  );
  if (orphanOffers.length) {
    console.log("\nПредложения с несуществующими категориями:");
    orphanOffers.forEach((offer) =>
      console.log(`- ${offer.title} [${offer.serviceType}]`)
    );
  } else {
    console.log("\nВсе предложения имеют валидную категорию.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Ошибка:", err);
  process.exit(1);
});
