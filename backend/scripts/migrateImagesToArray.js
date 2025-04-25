/**
 * Скрипт для миграции изображений из поля image в массив images
 * Запуск: node backend/scripts/migrateImagesToArray.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Offer = require("../models/Offer");

// Подключение к базе данных
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    migrateImages();
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1);
  });

/**
 * Функция для миграции изображений из поля image в массив images
 * для всех предложений в базе данных
 */
async function migrateImages() {
  try {
    console.log("🔄 Starting migration of images...");

    // Получаем все предложения, у которых есть image, но нет images или images пустой
    const offers = await Offer.find({
      image: { $exists: true, $ne: null, $ne: "" },
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } },
        { images: null },
      ],
    });

    console.log(`📊 Found ${offers.length} offers to update`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Обновляем каждое предложение
    for (const offer of offers) {
      try {
        if (!offer.image) {
          skippedCount++;
          continue;
        }

        // Проверяем, есть ли уже такое изображение в массиве
        if (Array.isArray(offer.images) && offer.images.includes(offer.image)) {
          console.log(
            `⏭️ Skipping offer ${offer._id}: image already in images array`
          );
          skippedCount++;
          continue;
        }

        // Создаем массив images, если его нет
        if (!offer.images) {
          offer.images = [];
        }

        // Добавляем изображение в массив
        offer.images.push(offer.image);

        // Сохраняем изменения
        await offer.save();

        console.log(
          `✅ Updated offer ${offer._id}: added image to images array`
        );
        updatedCount++;
      } catch (err) {
        console.error(`❌ Error updating offer ${offer._id}:`, err);
        errorCount++;
      }
    }

    console.log("\n📝 Migration summary:");
    console.log(`✅ Successfully updated: ${updatedCount} offers`);
    console.log(`⏭️ Skipped: ${skippedCount} offers`);
    console.log(`❌ Errors: ${errorCount} offers`);

    console.log("\n🎉 Migration completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during migration:", err);
    process.exit(1);
  }
}
