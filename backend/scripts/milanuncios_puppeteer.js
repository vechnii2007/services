const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const Category = require("../models/Category");
const Offer = require("../models/Offer");

const BASE_URL = "https://www.milanuncios.com";
const START_URL = `${BASE_URL}/anuncios-en-alicante/`;

async function getCategories(page) {
  console.log(`[Puppeteer] Открываю главную страницу: ${BASE_URL}`);
  await page.goto(BASE_URL, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: "debug_mainpage.png" });
  console.log(
    `[Puppeteer] Скриншот главной страницы сохранён: debug_mainpage.png`
  );
  const gridSelector = ".ma-CategoriesCarousel-grid";
  const carouselSelector = ".ma-CategoriesCarousel-carouselBody";
  const found = await Promise.race([
    page
      .waitForSelector(gridSelector, { timeout: 20000 })
      .then(() => gridSelector)
      .catch(() => null),
    page
      .waitForSelector(carouselSelector, { timeout: 20000 })
      .then(() => carouselSelector)
      .catch(() => null),
  ]);
  if (!found) {
    throw new Error(
      "Не найден ни один контейнер с категориями (grid/carouselBody). См. debug_mainpage.png"
    );
  }
  await new Promise((r) => setTimeout(r, 1000));
  const categories = await page.evaluate((selector) => {
    const seen = new Set();
    const links = document.querySelectorAll(
      `${selector} .ma-CategoriesCarouselCategoryItem-link`
    );
    return Array.from(links)
      .map((el) => {
        const title =
          el
            .querySelector(".ma-CategoriesCarouselCategoryItem-label")
            ?.innerText.trim() || el.innerText.trim();
        const link = el.getAttribute("href");
        const img =
          el
            .querySelector(".ma-CategoriesCarouselCategoryItem-image")
            ?.getAttribute("src") || "";
        return { title, link, img };
      })
      .filter((cat) => {
        if (!cat.link || seen.has(cat.link) || !cat.title) return false;
        seen.add(cat.link);
        return /^\/[a-zA-Z0-9\-]+\/?$/.test(cat.link);
      });
  }, found);
  console.log(`[Puppeteer] Найдено категорий: ${categories.length}`);
  const categoriesWithAlicante = categories.map((cat) => {
    let base = cat.link.replace(/\/$/, "");
    return {
      ...cat,
      alicanteUrl: `${BASE_URL}${base}-en-alicante/`,
    };
  });
  return categoriesWithAlicante;
}

async function getAds(page, categoryUrl, categoryName, maxPages = 1) {
  const ads = [];
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const url = `${categoryUrl}?pagina=${pageNum}`;
    await page.goto(url, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    // Ищем все article[data-testid="AD_CARD"]
    const pageAds = await page.evaluate(
      (BASE_URL, categoryName) => {
        const cards = document.querySelectorAll(
          'article[data-testid="AD_CARD"]'
        );
        return Array.from(cards).map((el) => {
          const title =
            el
              .querySelector(".ma-AdCardListingV2-TitleLink .ma-AdCardV2-title")
              ?.innerText.trim() || "";
          const link =
            el
              .querySelector(".ma-AdCardListingV2-TitleLink")
              ?.getAttribute("href") || "";
          const description =
            el.querySelector(".ma-AdCardV2-description")?.innerText.trim() ||
            "";
          const priceText =
            el
              .querySelector(".ma-AdPrice-value")
              ?.innerText.replace(/[^\d]/g, "") || "";
          const price = priceText ? parseInt(priceText, 10) : 0;
          const img =
            el
              .querySelector('img[data-e2e="ma-AdCardV2-photo"]')
              ?.getAttribute("src") || "";
          return {
            title,
            price,
            description,
            image: img,
            images: img ? [img] : [],
            link: link
              ? link.startsWith("http")
                ? link
                : BASE_URL + link
              : "",
            category: categoryName,
            serviceType: categoryName,
            location: "Alicante",
            providerId: null,
            status: "active",
          };
        });
      },
      BASE_URL,
      categoryName
    );
    console.log(
      `[Puppeteer] Категория: ${categoryName}, страница: ${pageNum}, найдено объявлений: ${pageAds.length}`
    );
    ads.push(...pageAds);
    await new Promise((r) => setTimeout(r, 1000));
  }
  return ads;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("[Puppeteer] Подключено к MongoDB");

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./puppeteer-profile",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  const categories = await getCategories(page);

  // Для теста: парсим только первые 2 категории
  const testCategories = categories.slice(0, 2);

  for (const cat of testCategories) {
    await Category.updateOne(
      { name: cat.title },
      { $set: { label: cat.title, image: cat.img } },
      { upsert: true }
    );
    console.log(`[Puppeteer] Категория сохранена: ${cat.title}`);

    const ads = await getAds(page, cat.alicanteUrl, cat.title, 1);
    console.log(
      `[Puppeteer] Найдено объявлений для категории ${cat.title}: ${ads.length}`
    );
    if (ads.length > 0) {
      console.log("[DEBUG] Пример объявления:", ads[0]);
    }
    if (ads.length === 0) {
      const safeTitle = cat.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
      const screenshotPath = `debug_ads_${safeTitle}.png`;
      await page.screenshot({ path: screenshotPath });
      console.log(
        `[Puppeteer] Скриншот страницы объявлений сохранён: ${screenshotPath}`
      );
    }
    for (const ad of ads) {
      try {
        await Offer.updateOne(
          { title: ad.title, description: ad.description },
          { $set: ad },
          { upsert: true }
        );
      } catch (err) {
        console.error(
          "[ERROR] Ошибка при сохранении объявления:",
          ad.title,
          err
        );
      }
    }
    console.log(
      `[Puppeteer] Сохранено объявлений для категории ${cat.title}: ${ads.length}`
    );
    await new Promise((r) => setTimeout(r, 2000));
  }

  await browser.close();
  await mongoose.disconnect();
  console.log("[Puppeteer] Готово!");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
