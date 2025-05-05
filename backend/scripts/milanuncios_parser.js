const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
console.log("MONGODB_URI:", process.env.MONGODB_URI);
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");
const Category = require("../models/Category");
const Offer = require("../models/Offer");

const BASE_URL = "https://www.milanuncios.com";
const START_URL = `${BASE_URL}/anuncios-en-alicante/`;
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

async function getCategories() {
  const { data } = await axios.get(START_URL, { headers: HEADERS });
  console.log("[getCategories] HTML получен, длина:", data.length);
  const fs = require("fs");
  fs.writeFileSync("debug_milanuncios.html", data.slice(0, 2000), "utf8");
  const $ = cheerio.load(data);
  const categories = [];
  const categoryLinks = $("a.ma-NavigationCategoryTree-menuDrawer-item-link");
  console.log(
    `[getCategories] Найдено элементов a.ma-NavigationCategoryTree-menuDrawer-item-link: ${categoryLinks.length}`
  );
  if (categoryLinks.length === 0) {
    console.log("[getCategories] Фрагмент HTML:", data.slice(0, 1000));
  }
  categoryLinks.each((i, el) => {
    const title = $(el)
      .find(".ma-NavigationCategoryTree-menuDrawer-item-labelTitle")
      .text()
      .trim();
    const link = $(el).attr("href");
    const img =
      $(el)
        .find("img.ma-NavigationCategoryTree-menuDrawer-item-image")
        .attr("src") || null;
    const desc = $(el).attr("aria-label") || "";
    console.log(
      `[getCategories] Категория: ${title}, ссылка: ${link}, img: ${img}`
    );
    categories.push({
      name: title,
      label: title,
      image: img || "",
      link: link.startsWith("http") ? link : BASE_URL + link,
      description: desc,
    });
  });
  return categories;
}

async function getAds(category, maxPages = 1) {
  const ads = [];
  const fs = require("fs");
  for (let page = 1; page <= maxPages; page++) {
    const url = `${category.link}?pagina=${page}`;
    const { data } = await axios.get(url, { headers: HEADERS });
    if (page === 1) {
      fs.writeFileSync("debug_ads.html", data.slice(0, 2000), "utf8");
    }
    const $ = cheerio.load(data);
    const adList = $(".ma-AdList.ma-AdList--listingCard3AdsPerRow");
    const adCards = adList.find("article, div.ma-AdCard");
    console.log(
      `[getAds] Категория: ${category.name}, страница: ${page}, найдено объявлений: ${adCards.length}`
    );
    if (adCards.length === 0) {
      console.log("[getAds] Фрагмент HTML:", data.slice(0, 1000));
    }
    adCards.each((i, el) => {
      const title = $(el)
        .find(".ma-AdCard-title, .ma-AdCard-titleText")
        .text()
        .trim();
      const priceText = $(el)
        .find(".ma-AdCard-price, .ma-AdCard-priceText")
        .text()
        .replace(/[^0-9]/g, "");
      const price = priceText ? parseInt(priceText, 10) : 0;
      const link = $(el).find("a").attr("href");
      const desc = $(el).find(".ma-AdCard-description").text().trim();
      const img = $(el).find("img").attr("src") || "";
      console.log(
        `[getAds] Объявление: ${title}, ссылка: ${link}, цена: ${price}, img: ${img}`
      );
      ads.push({
        title,
        price,
        description: desc,
        image: img,
        images: img ? [img] : [],
        link: link ? (link.startsWith("http") ? link : BASE_URL + link) : "",
        category: category.name,
        serviceType: category.name,
        location: "Alicante",
        providerId: null, // Можно доработать, если есть логика
        status: "active",
      });
    });
    await new Promise((r) => setTimeout(r, 1000));
  }
  return ads;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Подключено к MongoDB");

  const categories = await getCategories();
  console.log(`Найдено категорий: ${categories.length}`);

  for (const cat of categories) {
    // Сохраняем категорию (upsert)
    await Category.updateOne(
      { name: cat.name },
      { $set: { label: cat.label, image: cat.image } },
      { upsert: true }
    );
    console.log(`Категория сохранена: ${cat.name}`);

    // Парсим и сохраняем объявления (только 1 страница для примера)
    const ads = await getAds(cat, 1);
    for (const ad of ads) {
      // Для теста providerId ставим null, можно доработать
      await Offer.updateOne(
        { title: ad.title, description: ad.description },
        { $set: ad },
        { upsert: true }
      );
    }
    console.log(
      `Сохранено объявлений для категории ${cat.name}: ${ads.length}`
    );
  }

  await mongoose.disconnect();
  console.log("Готово!");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
