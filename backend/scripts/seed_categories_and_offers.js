const mongoose = require("mongoose");
require("dotenv").config();

const Category = require("../models/Category");
const Offer = require("../models/Offer");
const User = require("../models/User");

const CATEGORIES = [
  {
    name: "translation",
    label: "Translation",
    image: "https://placehold.co/300x180/eee/333?text=Translation",
  },
  {
    name: "legal",
    label: "Legal",
    image: "https://placehold.co/300x180/eee/333?text=Legal",
  },
  {
    name: "real_estate",
    label: "Real Estate",
    image: "https://placehold.co/300x180/eee/333?text=Real+Estate",
  },
  {
    name: "healthcare",
    label: "Healthcare",
    image: "https://placehold.co/300x180/eee/333?text=Healthcare",
  },
  {
    name: "education",
    label: "Education",
    image: "https://placehold.co/300x180/eee/333?text=Education",
  },
  {
    name: "finance",
    label: "Finance",
    image: "https://placehold.co/300x180/eee/333?text=Finance",
  },
  {
    name: "transport",
    label: "Transport",
    image: "https://placehold.co/300x180/eee/333?text=Transport",
  },
  {
    name: "household",
    label: "Household",
    image: "https://placehold.co/300x180/eee/333?text=Household",
  },
  {
    name: "shopping",
    label: "Shopping",
    image: "https://placehold.co/300x180/eee/333?text=Shopping",
  },
  {
    name: "beauty",
    label: "Beauty",
    image: "https://placehold.co/300x180/eee/333?text=Beauty",
  },
];

const LOCATIONS = [
  "Kyiv, Ukraine",
  "Berlin, Germany",
  "Warsaw, Poland",
  "Paris, France",
  "Rome, Italy",
  "Barcelona, Spain",
  "Lviv, Ukraine",
  "Prague, Czech Republic",
  "Vienna, Austria",
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // 1. Очищаем категории и предложения
  await Category.deleteMany({});
  await Offer.deleteMany({});

  // 2. Создаём категории
  await Category.insertMany(CATEGORIES);
  console.log(`Создано категорий: ${CATEGORIES.length}`);

  // 3. Находим всех провайдеров
  const providers = await User.find({ role: "provider" });
  if (!providers.length) {
    console.error("Нет провайдеров в базе!");
    await mongoose.disconnect();
    return;
  }
  console.log(`Найдено провайдеров: ${providers.length}`);

  // 4. Для каждой категории создаём 2-3 предложения
  let offers = [];
  for (const cat of CATEGORIES) {
    const numOffers = Math.floor(Math.random() * 2) + 2; // 2 или 3
    for (let i = 0; i < numOffers; i++) {
      const provider = getRandom(providers);
      offers.push({
        title: `${cat.label} Service #${i + 1}`,
        providerId: provider._id,
        serviceType: cat.name,
        category: cat.name,
        location: getRandom(LOCATIONS),
        description: `Best ${cat.label.toLowerCase()} service in town!`,
        price: Math.floor(Math.random() * 100) + 20,
        isPriceRange: false,
        images: [cat.image],
        image: cat.image,
        status: "active",
      });
    }
  }
  await Offer.insertMany(offers);
  console.log(`Создано предложений: ${offers.length}`);

  await mongoose.disconnect();
  console.log("Готово!");
}

main().catch((err) => {
  console.error("Ошибка:", err);
  process.exit(1);
});
