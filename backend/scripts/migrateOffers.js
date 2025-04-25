const mongoose = require("mongoose");
const Offer = require("../models/Offer");

async function migrateOffers() {
  try {
    console.log("Starting offers migration...");

    // Находим все предложения
    const offers = await Offer.find({});
    console.log(`Found ${offers.length} offers to migrate`);

    for (const offer of offers) {
      // Если есть serviceType, но нет category
      if (offer.serviceType && !offer.category) {
        offer.category = offer.serviceType;
      }
      // Если есть category, но нет serviceType
      else if (offer.category && !offer.serviceType) {
        offer.serviceType = offer.category;
      }

      // Обновляем promoted.promotionType если нужно
      if (offer.promoted && offer.promoted.promotionType) {
        const type = offer.promoted.promotionType.toUpperCase();
        if (["DAY", "WEEK"].includes(type)) {
          offer.promoted.promotionType = type;
        }
      }

      await offer.save();
      console.log(`Migrated offer ${offer._id}`);
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    mongoose.disconnect();
  }
}

// Подключаемся к базе данных и запускаем миграцию
mongoose
  .connect("mongodb://localhost:27017/service-portal")
  .then(() => {
    console.log("Connected to database");
    return migrateOffers();
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });
