const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const ServiceRequest = require(path.join(
  __dirname,
  "../models/ServiceRequest"
));

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/YOUR_DB_NAME";

async function main() {
  await mongoose.connect(MONGO_URI);

  const result = await ServiceRequest.deleteMany({
    $or: [{ userId: { $exists: false } }, { userId: null }],
  });

  console.log(`Удалено ${result.deletedCount} ServiceRequest без userId`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
