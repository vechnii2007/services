require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const faker = require("faker");

const User = require("../models/User");
const Offer = require("../models/Offer");
const Category = require("../models/Category");

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

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Добавить key в категории, если нет
  const categories = await Category.find();
  for (const cat of categories) {
    if (!cat.key) {
      // Простой вариант: key = первый не пустой name (ru/uk/es) в нижнем регистре, без пробелов
      const base =
        cat.name?.ru ||
        cat.name?.uk ||
        cat.name?.es ||
        Object.values(cat.name || {})[0] ||
        "";
      cat.key = base
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      await cat.save();
      console.log(`Category ${cat._id} assigned key: ${cat.key}`);
    }
  }

  // 2. Обновить serviceType в Offer
  const allCategories = await Category.find();
  const keyByOldName = {};
  for (const cat of allCategories) {
    // Сопоставляем старое строковое имя с новым key
    for (const lang of ["ru", "uk", "es"]) {
      if (cat.name?.[lang]) {
        keyByOldName[cat.name[lang]] = cat.key;
      }
    }
  }

  const offers = await Offer.find();
  for (const offer of offers) {
    // Если serviceType совпадает с каким-либо старым name — обновить на key
    const newKey = keyByOldName[offer.serviceType];
    if (newKey && offer.serviceType !== newKey) {
      offer.serviceType = newKey;
      await offer.save();
      console.log(`Offer ${offer._id} updated serviceType to: ${newKey}`);
    }
  }

  await mongoose.disconnect();
  console.log("Migration complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
