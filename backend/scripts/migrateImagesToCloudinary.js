require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { cloudinary } = require("../config/cloudinaryConfig");
const Offer = require("../models/Offer");
const Category = require("../models/Category");
const ServiceOffer = require("../models/ServiceOffer");

// Проверка настроек Cloudinary
console.log("Checking Cloudinary configuration...");
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("Error: Missing Cloudinary credentials in .env file");
  process.exit(1);
}

console.log("Cloudinary configuration found:", {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY?.substring(0, 5) + "...",
  hasSecret: !!process.env.CLOUDINARY_API_SECRET,
});

// Функция для загрузки файла в Cloudinary
const uploadToCloudinary = async (filePath) => {
  try {
    console.log(`Uploading ${path.basename(filePath)} to Cloudinary...`);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "service-portal",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });
    console.log(`Successfully uploaded ${path.basename(filePath)}`);
    return result.secure_url;
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, {
      message: error.message,
      code: error.http_code,
      details: error.error?.message || "",
    });
    return null;
  }
};

// Функция для миграции изображений одной модели
async function migrateModelImages(Model, modelName) {
  const items = await Model.find({});
  console.log(`\nMigrating ${items.length} ${modelName}...`);
  let successCount = 0;
  let errorCount = 0;

  for (const item of items) {
    try {
      let updated = false;
      console.log(`\nProcessing ${modelName} ${item._id}...`);

      // Обработка массива images
      if (item.images && Array.isArray(item.images)) {
        const newImages = [];
        console.log(`Found ${item.images.length} images to process`);

        for (const imagePath of item.images) {
          if (!imagePath.startsWith("http")) {
            const fileName = path.basename(imagePath);
            const fullPath = path.join(
              __dirname,
              "..",
              "uploads",
              "images",
              fileName
            );

            console.log(`Processing image: ${fileName}`);
            if (fs.existsSync(fullPath)) {
              const cloudinaryUrl = await uploadToCloudinary(fullPath);
              if (cloudinaryUrl) {
                newImages.push(cloudinaryUrl);
                updated = true;
                successCount++;
              } else {
                errorCount++;
              }
            } else {
              console.log(`File not found: ${fullPath}`);
              errorCount++;
            }
          } else {
            newImages.push(imagePath);
            console.log(`Skipping already uploaded image: ${imagePath}`);
          }
        }
        if (updated) {
          item.images = newImages;
        }
      }

      // Обработка одиночного поля image
      if (item.image && !item.image.startsWith("http")) {
        const fileName = path.basename(item.image);
        const fullPath = path.join(
          __dirname,
          "..",
          "uploads",
          "images",
          fileName
        );

        console.log(`Processing single image: ${fileName}`);
        if (fs.existsSync(fullPath)) {
          const cloudinaryUrl = await uploadToCloudinary(fullPath);
          if (cloudinaryUrl) {
            item.image = cloudinaryUrl;
            updated = true;
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          console.log(`File not found: ${fullPath}`);
          errorCount++;
        }
      }

      if (updated) {
        await item.save();
        console.log(`Updated ${modelName} ${item._id}`);
      }
    } catch (error) {
      console.error(`Error processing ${modelName} ${item._id}:`, error);
      errorCount++;
    }
  }

  console.log(`\n${modelName} migration summary:`);
  console.log(`- Successfully processed: ${successCount} images`);
  console.log(`- Errors encountered: ${errorCount} images`);
}

// Основная функция миграции
async function migrateImages() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Мигрируем изображения для всех моделей
    await migrateModelImages(Offer, "Offer");
    await migrateModelImages(Category, "Category");
    await migrateModelImages(ServiceOffer, "ServiceOffer");

    console.log("\nMigration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateImages();
