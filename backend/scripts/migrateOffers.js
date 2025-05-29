const mongoose = require("mongoose");
const Offer = require("../models/Offer");
const Category = require("../models/Category");

async function migrateOffers() {
  try {
    console.log("Starting offers migration...");
    const offers = await Offer.find({});
    console.log(`Found ${offers.length} offers to migrate`);
    let updated = 0,
      removed = 0;

    for (const offer of offers) {
      let changed = false;
      // Миграция category
      if (offer.category && typeof offer.category === "string") {
        const cat = await Category.findOne({
          $or: [
            { label: offer.category },
            { "name.ru": offer.category },
            { "name.uk": offer.category },
            { "name.es": offer.category },
          ],
        });
        if (cat) {
          offer.category = cat._id;
          changed = true;
        } else {
          await Offer.deleteOne({ _id: offer._id });
          removed++;
          console.log(
            `Removed offer ${offer._id} (category not found: ${offer.category})`
          );
          continue;
        }
      }
      // Миграция serviceType
      if (offer.serviceType && typeof offer.serviceType === "string") {
        const cat = await Category.findOne({
          $or: [
            { label: offer.serviceType },
            { "name.ru": offer.serviceType },
            { "name.uk": offer.serviceType },
            { "name.es": offer.serviceType },
          ],
        });
        if (cat) {
          offer.serviceType = cat._id;
          changed = true;
        } else {
          await Offer.deleteOne({ _id: offer._id });
          removed++;
          console.log(
            `Removed offer ${offer._id} (serviceType not found: ${offer.serviceType})`
          );
          continue;
        }
      }
      if (changed) {
        await offer.save();
        updated++;
        console.log(`Migrated offer ${offer._id}`);
      }
    }
    console.log(
      `Migration completed. Updated: ${updated}, Removed: ${removed}`
    );
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
