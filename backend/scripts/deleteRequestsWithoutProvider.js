const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

// Путь до модели ServiceRequest
const ServiceRequest = require(path.join(
  __dirname,
  "../models/ServiceRequest"
));

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/YOUR_DB_NAME"; // Берём из .env или fallback

async function main() {
  await mongoose.connect(MONGO_URI);

  const result = await ServiceRequest.deleteMany({
    $or: [{ providerId: { $exists: false } }, { providerId: null }],
  });

  console.log(`Удалено ${result.deletedCount} объявлений без providerId`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
