require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const faker = require("faker");
const path = require("path");

const User = require("../models/User");
const Offer = require("../models/Offer");

const CATEGORIES = [
  "finance",
  "healthcare",
  "education",
  "transport",
  "real_estate",
  "household",
  "legal",
  "translation",
  "shopping",
  "it",
  "tourism",
  "beauty",
  "auto",
  "food",
  "repair",
  "culture",
  "sports",
  "events",
];
const LOCATIONS = [
  "Alicante, Spain",
  "Kyiv, Ukraine",
  "Berlin, Germany",
  "Warsaw, Poland",
  "Paris, France",
  "Rome, Italy",
  "Barcelona, Spain",
  "Lviv, Ukraine",
  "Prague, Czech Republic",
  "Vienna, Austria",
];
const PROMOTION_TYPES = [null, "day", "week"];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomImage(category) {
  // Просто для примера, можно заменить на реальные пути
  return `image-${category}-${faker.datatype.number()}.jpg`;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const providers = await User.find({ role: "provider" });
  if (!providers.length) {
    console.error(
      "Нет пользователей с ролью provider. Добавьте хотя бы одного провайдера."
    );
    process.exit(1);
  }

  const offers = [];
  for (let i = 0; i < 50; i++) {
    const category = getRandom(CATEGORIES);
    const provider = getRandom(providers);
    const promotedType = getRandom(PROMOTION_TYPES);
    const isPromoted = !!promotedType;
    const now = new Date();
    let promoted = {
      isPromoted: false,
      promotedUntil: null,
      lastPromotedAt: null,
      promotionType: null,
    };
    if (isPromoted) {
      let days = promotedType === "day" ? 1 : promotedType === "week" ? 7 : 30;
      promoted = {
        isPromoted: true,
        promotedUntil: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
        lastPromotedAt: now,
        promotionType: promotedType,
      };
    }
    const images = [getRandomImage(category)];
    if (Math.random() > 0.5) images.push(getRandomImage(category));
    offers.push({
      title: faker.commerce.productName(),
      providerId: provider._id,
      serviceType: category,
      location: getRandom(LOCATIONS),
      description: faker.lorem.sentence(),
      price: faker.datatype.number({ min: 5, max: 500 }),
      isPriceRange: Math.random() > 0.7,
      priceFrom: null,
      priceTo: null,
      image: `http://localhost:5001/uploads/images/${images[0]}`,
      images,
      status: "active",
      favoritedBy: [],
      promoted,
      createdAt: now,
      updatedAt: now,
      category,
      rating: faker.datatype.number({ min: 0, max: 5 }),
      reviewCount: faker.datatype.number({ min: 0, max: 10 }),
      provider: {
        _id: provider._id,
        name: provider.name,
        email: provider.email,
        phone: provider.phone || "",
        address: provider.address || "",
        status: provider.status || "online",
      },
      __v: 0,
    });
  }

  await Offer.insertMany(offers);
  console.log(`Создано ${offers.length} предложений.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
