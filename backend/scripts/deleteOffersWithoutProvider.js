const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const Offer = require(path.join(__dirname, "../models/Offer"));

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/YOUR_DB_NAME";

async function main() {
  await mongoose.connect(MONGO_URI);

  const result = await Offer.deleteMany({
    $or: [{ providerId: { $exists: false } }, { providerId: null }],
  });

  console.log(`Удалено ${result.deletedCount} предложений без providerId`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
