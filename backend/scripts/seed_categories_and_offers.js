require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");

const Category = require("../models/Category");
const Offer = require("../models/Offer");
const User = require("../models/User");

const CATEGORIES = [
  {
    key: "real_estate",
    name: { ru: "Недвижимость", uk: "Нерухомість", es: "Inmobiliaria" },
    label: "Real Estate",
    image: "https://placehold.co/300x180/eee/333?text=Real+Estate",
  },
  {
    key: "auto",
    name: { ru: "Авто", uk: "Авто", es: "Motor" },
    label: "Auto",
    image: "https://placehold.co/300x180/eee/333?text=Auto",
  },
  {
    key: "services",
    name: { ru: "Услуги", uk: "Послуги", es: "Servicios" },
    label: "Services",
    image: "https://placehold.co/300x180/eee/333?text=Services",
  },
  {
    key: "jobs",
    name: { ru: "Работа", uk: "Робота", es: "Empleo" },
    label: "Jobs",
    image: "https://placehold.co/300x180/eee/333?text=Jobs",
  },
  {
    key: "electronics",
    name: { ru: "Электроника", uk: "Електроніка", es: "Electrónica" },
    label: "Electronics",
    image: "https://placehold.co/300x180/eee/333?text=Electronics",
  },
  {
    key: "fashion",
    name: { ru: "Мода", uk: "Мода", es: "Moda" },
    label: "Fashion",
    image: "https://placehold.co/300x180/eee/333?text=Fashion",
  },
  {
    key: "home_garden",
    name: { ru: "Дом и сад", uk: "Дім і сад", es: "Casa y Jardín" },
    label: "Home & Garden",
    image: "https://placehold.co/300x180/eee/333?text=Home+Garden",
  },
  {
    key: "hobby",
    name: {
      ru: "Хобби и отдых",
      uk: "Хобі та відпочинок",
      es: "Aficiones y Ocio",
    },
    label: "Hobby & Leisure",
    image: "https://placehold.co/300x180/eee/333?text=Hobby",
  },
  {
    key: "kids",
    name: { ru: "Дети", uk: "Діти", es: "Bebés" },
    label: "Kids",
    image: "https://placehold.co/300x180/eee/333?text=Kids",
  },
  {
    key: "pets",
    name: { ru: "Животные", uk: "Тварини", es: "Mascotas" },
    label: "Pets",
    image: "https://placehold.co/300x180/eee/333?text=Pets",
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

  // Получаем реальные объекты категорий с _id
  const categories = await Category.find({});

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
  for (const cat of categories) {
    const numOffers = Math.floor(Math.random() * 2) + 2; // 2 или 3
    for (let i = 0; i < numOffers; i++) {
      const provider = getRandom(providers);
      offers.push({
        title: `${cat.label} Service #${i + 1}`,
        providerId: provider._id,
        serviceType: cat._id,
        category: cat._id,
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
