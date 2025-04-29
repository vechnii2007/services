require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const faker = require("faker");

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

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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
  const totalOffers = 50;
  const promotedCount = Math.floor(totalOffers * 0.2); // 20% топовых
  for (let i = 0; i < totalOffers; i++) {
    const category = getRandom(CATEGORIES);
    const provider = getRandom(providers);
    const isPromoted = i < promotedCount;
    const now = new Date();
    let promoted = {
      isPromoted: false,
      promotedUntil: null,
      lastPromotedAt: null,
      promotionType: null,
    };
    if (isPromoted) {
      const days = faker.random.arrayElement([1, 7]);
      promoted = {
        isPromoted: true,
        promotedUntil: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
        lastPromotedAt: now,
        promotionType: days === 1 ? "day" : "week",
      };
    }
    // Картинки через picsum.photos
    const imageUrl = `https://picsum.photos/200/300?random=${i + 1}`;
    const images = [imageUrl];
    if (Math.random() > 0.5)
      images.push(`https://picsum.photos/200/300?random=${i + 100}`);
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
      image: imageUrl,
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
