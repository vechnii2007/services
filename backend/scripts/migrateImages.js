const mongoose = require("mongoose");
const Offer = require("../models/Offer");
require("dotenv").config();

async function migrateImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Находим все предложения со старым полем image
    const offers = await Offer.find({ image: { $exists: true } });
    console.log(`Found ${offers.length} offers with old image field`);

    for (const offer of offers) {
      // Если есть image и его нет в images
      if (
        offer.image &&
        (!offer.images || !offer.images.includes(offer.image))
      ) {
        offer.images = offer.images || [];
        offer.images.push(offer.image);
        offer.image = undefined;
        await offer.save();
        console.log(`Migrated images for offer ${offer._id}`);
      }
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

migrateImages();
