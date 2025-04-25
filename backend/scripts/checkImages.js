/**
 * Скрипт для проверки и исправления путей к изображениям в базе данных
 * Запуск: node backend/scripts/checkImages.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Offer = require("../models/Offer");

// Подключение к базе данных
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    checkImages();
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1);
  });

/**
 * Функция для проверки и исправления путей к изображениям
 */
async function checkImages() {
  try {
    console.log("🔍 Checking images in database...");

    // Путь к директории с изображениями
    const imagesDir = path.join(__dirname, "..", "uploads", "images");
    console.log(`📁 Images directory: ${imagesDir}`);

    // Проверяем существование директории
    if (!fs.existsSync(imagesDir)) {
      console.error(`❌ Images directory does not exist: ${imagesDir}`);
      process.exit(1);
    }

    // Получаем список всех файлов в директории
    const existingFiles = new Set(fs.readdirSync(imagesDir));
    console.log(`📊 Found ${existingFiles.size} files in images directory`);

    // Получаем все предложения с изображениями
    const offers = await Offer.find({
      $or: [
        { image: { $exists: true, $ne: null, $ne: "" } },
        { images: { $exists: true, $ne: null, $not: { $size: 0 } } },
      ],
    });

    console.log(`📊 Found ${offers.length} offers with images in database`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Проверяем каждое предложение
    for (const offer of offers) {
      try {
        let changed = false;

        // Проверяем поле image
        if (offer.image) {
          const imageName = offer.image.split("/").pop();
          if (!existingFiles.has(imageName)) {
            console.log(
              `⚠️ Image file not found for offer ${offer._id}: ${imageName}`
            );
            offer.image = null;
            changed = true;
          }
        }

        // Проверяем массив images
        if (Array.isArray(offer.images) && offer.images.length > 0) {
          const validImages = [];

          for (const imagePath of offer.images) {
            const imageName = imagePath.split("/").pop();
            if (existingFiles.has(imageName)) {
              validImages.push(imageName);
            } else {
              console.log(
                `⚠️ Image file not found in images array for offer ${offer._id}: ${imageName}`
              );
              changed = true;
            }
          }

          if (validImages.length !== offer.images.length) {
            offer.images = validImages;
            changed = true;
          }
        }

        // Если массив images пуст, но есть image, добавляем его в массив
        if ((!offer.images || offer.images.length === 0) && offer.image) {
          offer.images = [offer.image.split("/").pop()];
          changed = true;
        }

        // Сохраняем изменения, если были изменения
        if (changed) {
          await offer.save();
          console.log(`✅ Fixed offer ${offer._id}`);
          fixedCount++;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`❌ Error checking offer ${offer._id}:`, err);
        errorCount++;
      }
    }

    console.log("\n📝 Check summary:");
    console.log(`✅ Fixed: ${fixedCount} offers`);
    console.log(`⏭️ Skipped: ${skippedCount} offers`);
    console.log(`❌ Errors: ${errorCount} offers`);

    console.log("\n🎉 Check completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during check:", err);
    process.exit(1);
  }
}
