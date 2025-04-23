const express = require("express");
const router = express.Router();
const searchService = require("../services/searchService");
const auth = require("../middleware/auth");
const Offer = require("../models/Offer");
const ServiceOffer = require("../models/ServiceOffer");

// Получить популярные поисковые запросы
router.get("/popular", async (req, res) => {
  try {
    const { limit = 5, timeframe = "7d" } = req.query;
    const popularSearches = await searchService.getPopularSearches(
      parseInt(limit),
      timeframe
    );
    res.json(popularSearches);
  } catch (error) {
    console.error("Error fetching popular searches:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching popular searches",
      error: error.message,
    });
  }
});

// Поиск по предложениям
router.get("/offers", async (req, res) => {
  try {
    const {
      query,
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      location,
      category,
    } = req.query;

    console.log("[search/offers] Search params:", {
      query,
      page,
      limit,
      minPrice,
      maxPrice,
      location,
      category,
    });

    // Базовый фильтр
    const filter = {};

    // Добавляем фильтры по цене, локации и категории
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
    }

    if (location) {
      filter.location = location;
    }

    if (category) {
      filter.category = category;
    }

    // Добавляем поисковый запрос, если он есть
    if (query && query.trim() !== "") {
      const searchRegex = new RegExp(query.trim(), "i");
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { serviceType: searchRegex },
      ];

      // Сохраняем поисковый запрос для статистики
      await searchService.saveSearchQuery(query, category);
    }

    console.log("[search/offers] MongoDB filter:", filter);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Выполняем поиск и подсчет общего количества
    const [offers, total] = await Promise.all([
      Offer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("providerId", "name email")
        .lean(),
      Offer.countDocuments(filter),
    ]);

    console.log(
      `[search/offers] Found ${offers.length} offers out of ${total} total`
    );

    // Отправляем результаты
    res.json({
      offers,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("[search/offers] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching offers",
      error: error.message,
    });
  }
});

// Сохранить поисковый запрос
router.post("/", auth, async (req, res) => {
  try {
    const { query, category } = req.body;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }
    const savedQuery = await searchService.saveSearchQuery(query, category);
    res.status(201).json({
      success: true,
      data: savedQuery,
    });
  } catch (error) {
    console.error("Error saving search query:", error);
    res.status(500).json({
      success: false,
      message: "Error saving search query",
      error: error.message,
    });
  }
});

// Очистка старых поисковых запросов (только для админов)
router.delete("/cleanup", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }
    const { olderThan = "90d" } = req.query;
    const result = await searchService.cleanupOldSearches(olderThan);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error cleaning up searches:", error);
    res.status(500).json({
      success: false,
      message: "Error cleaning up searches",
      error: error.message,
    });
  }
});

module.exports = router;
