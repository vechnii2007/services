/**
 * Скрипт для анализа использования полей image и images в коллекции Offers
 * Запуск: node backend/scripts/analyzeImageUsage.js
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
    analyzeImageUsage();
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1);
  });

/**
 * Функция для анализа использования полей image и images в коллекции Offers
 */
async function analyzeImageUsage() {
  try {
    console.log("🔍 Analyzing image usage in offers...\n");

    const totalOffers = await Offer.countDocuments();

    // Предложения с полем image
    const offersWithImage = await Offer.countDocuments({
      image: { $exists: true, $ne: null, $ne: "" },
    });

    // Предложения с массивом images
    const offersWithImages = await Offer.countDocuments({
      images: { $exists: true, $ne: null, $not: { $size: 0 } },
    });

    // Предложения с обоими полями
    const offersWithBoth = await Offer.countDocuments({
      image: { $exists: true, $ne: null, $ne: "" },
      images: { $exists: true, $ne: null, $not: { $size: 0 } },
    });

    // Предложения без изображений
    const offersWithoutImages = await Offer.countDocuments({
      $or: [{ image: { $exists: false } }, { image: null }, { image: "" }],
      $or: [
        { images: { $exists: false } },
        { images: null },
        { images: { $size: 0 } },
      ],
    });

    // Предложения, где image не совпадает с первым элементом images
    const offersWithMismatch = await Offer.countDocuments({
      image: { $exists: true, $ne: null, $ne: "" },
      images: { $exists: true, $ne: null, $not: { $size: 0 } },
      $expr: { $ne: ["$image", { $arrayElemAt: ["$images", 0] }] },
    });

    // Вывод статистики
    console.log("📊 Image Usage Statistics:");
    console.log(`Total offers: ${totalOffers}`);
    console.log(
      `Offers with 'image' field: ${offersWithImage} (${(
        (offersWithImage / totalOffers) *
        100
      ).toFixed(2)}%)`
    );
    console.log(
      `Offers with 'images' array: ${offersWithImages} (${(
        (offersWithImages / totalOffers) *
        100
      ).toFixed(2)}%)`
    );
    console.log(
      `Offers with both fields: ${offersWithBoth} (${(
        (offersWithBoth / totalOffers) *
        100
      ).toFixed(2)}%)`
    );
    console.log(
      `Offers without any images: ${offersWithoutImages} (${(
        (offersWithoutImages / totalOffers) *
        100
      ).toFixed(2)}%)`
    );
    console.log(
      `Offers with mismatch between image and images[0]: ${offersWithMismatch} (${(
        (offersWithMismatch / totalOffers) *
        100
      ).toFixed(2)}%)`
    );

    // Анализ размеров массивов images
    const imagesLengthStats = await Offer.aggregate([
      { $match: { images: { $exists: true, $ne: null, $not: { $size: 0 } } } },
      { $project: { imagesLength: { $size: "$images" } } },
      {
        $group: {
          _id: "$imagesLength",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log("\n📏 Images Array Length Distribution:");
    imagesLengthStats.forEach((stat) => {
      console.log(
        `Offers with ${stat._id} image(s): ${stat.count} (${(
          (stat.count / totalOffers) *
          100
        ).toFixed(2)}%)`
      );
    });

    // Вывод нескольких примеров
    console.log("\n📋 Sample Offers:");

    // Пример предложения только с image
    const sampleWithImage = await Offer.findOne({
      image: { $exists: true, $ne: null, $ne: "" },
      $or: [
        { images: { $exists: false } },
        { images: null },
        { images: { $size: 0 } },
      ],
    }).select("_id title image images");

    if (sampleWithImage) {
      console.log("Example offer with only image field:");
      console.log(sampleWithImage.toJSON());
    }

    // Пример предложения только с images
    const sampleWithImages = await Offer.findOne({
      images: { $exists: true, $ne: null, $not: { $size: 0 } },
      $or: [{ image: { $exists: false } }, { image: null }, { image: "" }],
    }).select("_id title image images");

    if (sampleWithImages) {
      console.log("\nExample offer with only images array:");
      console.log(sampleWithImages.toJSON());
    }

    // Пример предложения с обоими полями
    const sampleWithBoth = await Offer.findOne({
      image: { $exists: true, $ne: null, $ne: "" },
      images: { $exists: true, $ne: null, $not: { $size: 0 } },
    }).select("_id title image images");

    if (sampleWithBoth) {
      console.log("\nExample offer with both fields:");
      console.log(sampleWithBoth.toJSON());
    }

    console.log("\n🎉 Analysis completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during analysis:", err);
    process.exit(1);
  }
}
