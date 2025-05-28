const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/../.env" });

const Offer = require("../models/Offer");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const offersWithStringCategory = await Offer.find({
    category: { $type: "string" },
  });
  const offersWithStringServiceType = await Offer.find({
    serviceType: { $type: "string" },
  });

  const idsToDelete = [
    ...offersWithStringCategory.map((o) => o._id.toString()),
    ...offersWithStringServiceType.map((o) => o._id.toString()),
  ];

  if (idsToDelete.length === 0) {
    console.log("Нет офферов с category или serviceType типа string.");
  } else {
    const res = await Offer.deleteMany({ _id: { $in: idsToDelete } });
    console.log(`Удалено офферов: ${res.deletedCount}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Ошибка:", err);
  process.exit(1);
});
