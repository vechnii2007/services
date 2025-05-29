require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const faker = require("faker");

const User = require("../models/User");
const Offer = require("../models/Offer");
const Category = require("../models/Category");

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

  // Удаляем все офферы
  await Offer.deleteMany({});
  console.log("Все офферы удалены");

  const providers = await User.find({ role: "provider" });
  if (!providers.length) {
    console.error(
      "Нет пользователей с ролью provider. Добавьте хотя бы одного провайдера."
    );
    process.exit(1);
  }

  const categories = await Category.find({});
  if (categories.length < 2) {
    console.error(
      "Недостаточно категорий для генерации офферов. Добавьте хотя бы две."
    );
    process.exit(1);
  }

  const offers = [];
  for (const provider of providers) {
    // Для каждого провайдера — по 2 оффера с разными категориями
    const cats = faker.helpers.shuffle(categories).slice(0, 2);
    for (const cat of cats) {
      const now = new Date();
      const imageUrl = `https://picsum.photos/200/300?random=${faker.datatype.number()}`;
      offers.push({
        title: faker.commerce.productName(),
        providerId: provider._id,
        serviceType: cat._id,
        category: cat._id,
        location: getRandom(LOCATIONS),
        description: faker.lorem.sentence(),
        price: faker.datatype.number({ min: 5, max: 500 }),
        isPriceRange: false,
        images: [imageUrl],
        image: imageUrl,
        status: "active",
        favoritedBy: [],
        promoted: {
          isPromoted: false,
          promotedUntil: null,
          lastPromotedAt: null,
          promotionType: null,
        },
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  await Offer.insertMany(offers);
  console.log(`Создано ${offers.length} предложений.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
