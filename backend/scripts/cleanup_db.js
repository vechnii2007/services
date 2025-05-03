const mongoose = require("mongoose");
require("dotenv").config();

const Category = require("../models/Category");
const Offer = require("../models/Offer");
const ServiceOffer = require("../models/ServiceOffer");
const ServiceRequest = require("../models/ServiceRequest");
const CategoryStats = require("../models/CategoryStats");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Удаляем все категории
  const catRes = await Category.deleteMany({});
  console.log(`Удалено категорий: ${catRes.deletedCount}`);

  // Удаляем все предложения
  const offerRes = await Offer.deleteMany({});
  console.log(`Удалено предложений: ${offerRes.deletedCount}`);

  // Удаляем все сервисные предложения (если есть)
  if (ServiceOffer) {
    const soRes = await ServiceOffer.deleteMany({});
    console.log(`Удалено сервисных предложений: ${soRes.deletedCount}`);
  }

  // Удаляем все сервисные запросы (если есть)
  if (ServiceRequest) {
    const srRes = await ServiceRequest.deleteMany({});
    console.log(`Удалено сервисных запросов: ${srRes.deletedCount}`);
  }

  // Удаляем статистику по категориям (если есть)
  if (CategoryStats) {
    const csRes = await CategoryStats.deleteMany({});
    console.log(`Удалено статистики по категориям: ${csRes.deletedCount}`);
  }

  // Пользователей не трогаем!
  console.log("Пользователи НЕ затронуты.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Ошибка:", err);
  process.exit(1);
});
