const mongoose = require("mongoose");
const ServiceRequest = require("../models/ServiceRequest");
const Category = require("../models/Category");

async function migrateServiceRequests() {
  await mongoose.connect("mongodb://localhost:27017/service-portal");
  const requests = await ServiceRequest.find({});
  let updated = 0,
    removed = 0;
  for (const req of requests) {
    if (req.serviceType && typeof req.serviceType === "string") {
      const cat = await Category.findOne({
        $or: [
          { label: req.serviceType },
          { "name.ru": req.serviceType },
          { "name.uk": req.serviceType },
          { "name.es": req.serviceType },
        ],
      });
      if (cat) {
        req.serviceType = cat._id;
        await req.save();
        updated++;
        console.log(`Updated request ${req._id}`);
      } else {
        await ServiceRequest.deleteOne({ _id: req._id });
        removed++;
        console.log(
          `Removed request ${req._id} (category not found: ${req.serviceType})`
        );
      }
    }
  }
  console.log(`Migration complete. Updated: ${updated}, Removed: ${removed}`);
  await mongoose.disconnect();
}

migrateServiceRequests().catch((e) => {
  console.error(e);
  process.exit(1);
});
