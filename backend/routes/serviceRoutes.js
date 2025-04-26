const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { isProvider, isAdmin } = require("../middleware/authMiddleware");
const { upload, UPLOADS_PATH } = require("../config/uploadConfig");
const ServiceRequest = require("../models/ServiceRequest");
const ServiceOffer = require("../models/ServiceOffer");
const Offer = require("../models/Offer");
const Category = require("../models/Category");
const Message = require("../models/Message");
const Favorite = require("../models/Favorite");
const Notification = require("../models/Notification");
const User = require("../models/User");
const auth = require("../middleware/auth");
const path = require("path");
const categoryStatsService = require("../services/CategoryStatsService");
const promotionService = require("../services/promotionService");
const categoryController = require("../controllers/categoryController");
const fs = require("fs");
const NotificationService = require("../services/NotificationService");
const Review = require("../models/Review");

// Базовый URL бэкенда
const BASE_URL = "http://localhost:5001";

// Получение всех категорий (доступно всем)
router.get("/categories", categoryController.getAllCategories);

// Получение уникальных местоположений (доступно всем)
router.get("/locations", async (req, res) => {
  try {
    const serviceLocations = await ServiceOffer.distinct("location");
    const offerLocations = await Offer.distinct("location");
    const allLocations = [...new Set([...serviceLocations, ...offerLocations])]
      .filter((location) => location)
      .sort();
    res.json(allLocations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Создание категории (доступно только admin)
router.post(
  "/categories",
  auth,
  isAdmin,
  upload.single("image"),
  categoryController.createCategory
);

// Обновление категории (доступно только admin)
router.put(
  "/categories/:id",
  auth,
  isAdmin,
  upload.single("image"),
  categoryController.updateCategory
);

// Получение всех предложений с фильтрацией по категории и поиском по тексту
router.get("/offers", async (req, res) => {
  console.log("[serviceRoutes] GET /offers request received");

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const filter = {};

  // Фильтрация по категории
  if (req.query.category) {
    filter.serviceType = req.query.category;
  }

  // Поиск по текстовому запросу в заголовке и описании
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { location: searchRegex },
    ];
  }

  // Фильтрация по цене
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = parseInt(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = parseInt(req.query.maxPrice);
  }

  // Фильтрация по местоположению
  if (req.query.location) {
    filter.location = new RegExp(req.query.location, "i");
  }

  // Получаем только активные предложения
  filter.status = "active";

  try {
    console.log("[serviceRoutes] Fetching offers with filter:", filter);

    // Получаем предложения с учетом фильтрации, пагинации и сортировки
    const offers = await Offer.find(filter)
      .populate("providerId", "name email phone address status")
      .skip(skip)
      .limit(limit)
      .sort({ "promoted.isPromoted": -1, createdAt: -1 });

    // Получаем общее количество предложений для пагинации
    const totalOffers = await Offer.countDocuments(filter);
    const totalPages = Math.ceil(totalOffers / limit);

    console.log(
      `[serviceRoutes] Found ${offers.length} offers out of ${totalOffers} total`
    );

    // Логируем несколько предложений для отладки
    offers.slice(0, 5).forEach((offer, index) => {
      console.log(
        `[serviceRoutes] Offer ${index + 1}/${Math.min(5, offers.length)}:`,
        {
          id: offer._id,
          category: offer.serviceType,
          location: offer.location,
          price: offer.price,
          provider: offer.providerId
            ? offer.providerId.name || "Unknown"
            : "Unknown",
        }
      );
    });

    // Для каждого предложения получаем рейтинг и количество отзывов по предложению
    const formattedOffers = await Promise.all(
      offers.map(async (offer) => {
        let provider = offer.providerId || null;
        // Получаем рейтинг и отзывы по предложению
        const offerRatingInfo = await Review.getAverageRatingByOffer(offer._id);
        // Создаем базовый объект предложения
        const formattedOffer = {
          ...offer._doc,
          rating: offerRatingInfo.rating,
          reviewCount: offerRatingInfo.count,
          provider: provider ? { ...provider._doc } : null,
        };
        // Убедимся, что providerId правильно установлен
        if (provider && provider._id) {
          formattedOffer.providerId = provider._id;
        }
        // Преобразуем URL изображений
        if (offer.image) {
          formattedOffer.image = `${BASE_URL}${UPLOADS_PATH}/${offer.image}`;
        }
        return formattedOffer;
      })
    );

    res.json({
      offers: formattedOffers,
      totalPages,
      currentPage: page,
      totalOffers,
    });
  } catch (error) {
    console.error("[serviceRoutes] Error fetching offers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение списка поднятых объявлений
router.get("/offers/promoted", async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(
    `[${requestId}][Promotion] GET /offers/promoted request received:`,
    {
      query: req.query,
      userAgent: req.headers["user-agent"],
      referer: req.headers["referer"],
    }
  );

  try {
    // Извлекаем и валидируем параметры запроса
    const limit =
      req.query.limit !== undefined ? parseInt(req.query.limit) : 10;
    const skip = req.query.skip !== undefined ? parseInt(req.query.skip) : 0;

    console.log(`[${requestId}][Promotion] Parsed query parameters:`, {
      limit,
      skip,
    });

    if (isNaN(limit) || isNaN(skip) || limit < 1 || skip < 0) {
      console.warn(`[${requestId}][Promotion] Invalid query parameters:`, {
        rawLimit: req.query.limit,
        rawSkip: req.query.skip,
        parsedLimit: limit,
        parsedSkip: skip,
      });
      return res.status(400).json({
        error:
          "Invalid parameters. Limit must be at least 1, skip must be at least 0.",
        params: { limit, skip },
      });
    }

    // Засекаем время выполнения запроса
    const startTime = Date.now();
    const promotedOffers = await promotionService.getPromotedOffers(
      limit,
      skip
    );
    const queryTime = Date.now() - startTime;

    console.log(`[${requestId}][Promotion] Query executed in ${queryTime}ms:`, {
      offersFound: promotedOffers.offers.length,
      totalPromoted: promotedOffers.total,
    });

    res.json(promotedOffers);
  } catch (error) {
    console.error(`[${requestId}][Promotion] Error getting promoted offers:`, {
      error: error.message,
      stack: error.stack,
      query: req.query,
    });
    res.status(500).json({
      error: "Failed to retrieve promoted offers",
      message: error.message,
    });
  }
});

// Получение конкретного предложения по ID (доступно всем, включая гостей)
router.get("/offers/:id", async (req, res) => {
  try {
    const service = await ServiceOffer.findById(req.params.id);
    if (service) {
      return res.json({ ...service._doc, type: "ServiceOffer" });
    }

    const offer = await Offer.findById(req.params.id).populate({
      path: "providerId",
      select: "name email phone address status providerInfo createdAt",
    });

    if (offer) {
      // Получаем рейтинг и отзывы по предложению
      const offerRatingInfo = await Review.getAverageRatingByOffer(offer._id);
      // Форматируем ответ
      const formattedOffer = {
        ...offer._doc,
        type: "Offer",
        rating: offerRatingInfo.rating,
        reviewCount: offerRatingInfo.count,
        provider: {
          _id: offer.providerId._id,
          name: offer.providerId.name,
          email: offer.providerId.email,
          phone: offer.providerId.phone,
          address: offer.providerId.address,
          status: offer.providerId.status,
          createdAt: offer.providerId.createdAt,
          providerInfo: offer.providerId.providerInfo,
        },
      };

      // Добавляем URL для изображений
      if (offer.image) {
        formattedOffer.image = `${BASE_URL}${UPLOADS_PATH}/${offer.image}`;
      }
      if (offer.images && offer.images.length > 0) {
        formattedOffer.images = offer.images.map(
          (img) => `${BASE_URL}${UPLOADS_PATH}/${img}`
        );
      }

      return res.json(formattedOffer);
    }

    res.status(404).json({ error: "Offer not found" });
  } catch (error) {
    console.error("Error fetching offer by ID:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение предложений текущего пользователя (доступно только provider и admin)
router.get("/my-offers", auth, async (req, res) => {
  try {
    if (!["provider", "admin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Providers and admins only." });
    }

    console.log("[serviceRoutes] GET /my-offers request received");
    console.log("[serviceRoutes] User details:", {
      userId: req.user.id,
      userIdUnderscored: req.user._id,
      userRole: req.user.role,
      userHeaders: {
        authorization: req.headers.authorization ? "Bearer [REDACTED]" : "none",
      },
    });

    // Проверка внутренней структуры req.user
    console.log(
      "[serviceRoutes] req.user structure:",
      JSON.stringify({
        id: req.user.id,
        _id: req.user._id,
        role: req.user.role,
        keys: Object.keys(req.user),
      })
    );

    // Используем ID пользователя, учитывая оба возможных формата
    const userId = req.user._id || req.user.id;

    // Для отладки - покажем как выглядит запрос к базе данных
    console.log("[serviceRoutes] Querying MongoDB with:", {
      providerId: userId,
    });

    // Ищем предложения с любым из возможных идентификаторов пользователя
    const offers = await Offer.find({
      $or: [{ providerId: userId }, { providerId: userId.toString() }],
    }).populate("providerId", "name email phone address status");

    console.log(
      `[serviceRoutes] Found ${offers.length} offers for user ${userId}`
    );

    // Если предложений не найдено, проверим, есть ли вообще какие-то предложения в базе
    if (offers.length === 0) {
      const allOffers = await Offer.find({}).limit(5);
      console.log(
        "[serviceRoutes] No offers found for user. Total offers in DB:",
        allOffers.length
      );

      if (allOffers.length > 0) {
        allOffers.forEach((offer, index) => {
          console.log(`[serviceRoutes] DB Offer ${index + 1}:`, {
            _id: offer._id,
            providerId: offer.providerId ? offer.providerId.toString() : "null",
            title: offer.title || "untitled",
            matches:
              offer.providerId &&
              (offer.providerId.toString() === userId.toString() ||
                offer.providerId.toString() === req.user.id)
                ? "YES"
                : "NO",
          });
        });
      }
    }

    // Логируем каждое предложение
    offers.forEach((offer, index) => {
      console.log(`[serviceRoutes] Offer ${index + 1}/${offers.length}:`, {
        _id: offer._id,
        providerId: offer.providerId
          ? (offer.providerId._id || offer.providerId).toString()
          : "null",
        title: offer.title,
        category: offer.category || offer.serviceType,
        price: offer.price,
      });
    });

    const formattedOffers = offers.map((offer) => {
      const offerData = {
        ...offer._doc,
        providerId: userId, // Явно добавляем providerId
      };

      // Проверяем наличие изображений и форматируем их URL
      if (offer.image) {
        offerData.image = `${BASE_URL}${UPLOADS_PATH}/${offer.image}`;
      }
      if (Array.isArray(offer.images)) {
        offerData.images = offer.images.map((image) =>
          image
            ? `${BASE_URL}${UPLOADS_PATH}/${image}`
            : "https://via.placeholder.com/150?text=Offer"
        );
      } else {
        offerData.images = [];
      }
      return offerData;
    });

    console.log(
      "[serviceRoutes] Returning formatted offers:",
      formattedOffers.length
    );
    res.json(formattedOffers);
  } catch (error) {
    console.error("[serviceRoutes] Error fetching my offers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Создание предложения (доступно только провайдерам)
router.post(
  "/offers",
  auth,
  isProvider,
  upload.array("images", 10),
  async (req, res) => {
    try {
      console.log("Creating new offer:", req.body);

      const {
        title,
        category,
        location,
        description,
        price,
        priceFrom,
        priceTo,
        isPriceRange,
        providerId,
      } = req.body;

      // Проверяем, что все необходимые поля присутствуют
      if (!title || !category || !location || !description) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Проверяем наличие ценовой информации
      if (isPriceRange === "true") {
        // Проверка диапазона цен
        if (!priceFrom || !priceTo) {
          return res.status(400).json({
            error: "Price range requires both minimum and maximum values",
          });
        }
      } else {
        // Проверка фиксированной цены
        if (!price) {
          return res.status(400).json({ error: "Price is required" });
        }
      }

      // Если указан providerId (для админов), используем его, иначе используем ID текущего пользователя
      const actualProviderId = providerId || req.user.id;

      // Проверяем существование провайдера
      const provider = await User.findById(actualProviderId);
      if (
        !provider ||
        (provider.role !== "provider" && provider.role !== "admin")
      ) {
        return res.status(400).json({ error: "Invalid provider" });
      }

      // Обрабатываем загруженные изображения
      const images = req.files ? req.files.map((file) => file.filename) : [];
      const mainImage = images.length > 0 ? images[0] : null;

      // Создаем новое предложение
      const offerData = {
        title,
        serviceType: category,
        location,
        description,
        providerId: actualProviderId,
        images,
        image: mainImage,
        status: "active",
      };

      // Добавляем ценовую информацию в зависимости от типа цены
      if (isPriceRange === "true") {
        offerData.priceFrom = Number(priceFrom);
        offerData.priceTo = Number(priceTo);
        offerData.isPriceRange = true;
        offerData.price = Number(priceFrom); // Для обратной совместимости используем минимальную цену
      } else {
        offerData.price = Number(price);
        offerData.isPriceRange = false;
      }

      const offer = new Offer(offerData);

      await offer.save();

      // Обновляем статистику категории
      await categoryStatsService.incrementCategoryCount(category);

      // Обновляем статистику провайдера
      await provider.incrementTotalRequests();

      res.status(201).json(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Обновление предложения
router.put(
  "/offers/:id",
  auth,
  isProvider,
  upload.array("images", 5),
  async (req, res) => {
    try {
      console.log("[serviceRoutes] PUT /offers/:id request received");
      const { title, description, price, location, category, existingImages } =
        req.body;

      const offer = await Offer.findById(req.params.id);
      if (!offer) {
        console.log("[serviceRoutes] Offer not found:", req.params.id);
        return res.status(404).json({ message: "Предложение не найдено" });
      }

      // Проверяем, принадлежит ли предложение текущему пользователю
      if (
        offer.providerId.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          message: "У вас нет доступа к редактированию этого предложения",
        });
      }

      console.log("[serviceRoutes] Updating offer:", {
        id: req.params.id,
        providerId: offer.providerId,
        currentUser: req.user.id,
        title,
        description,
        price,
        location,
        category,
      });

      // Обновляем поля, если они присутствуют в запросе
      if (title) offer.title = title;
      if (description) offer.description = description;
      if (price) offer.price = parseFloat(price);
      if (location) offer.location = location;
      if (category) {
        offer.serviceType = category;
        offer.category = category;
      }

      // Обработка изображений
      let updatedImages = [];

      // Добавляем существующие изображения, если они были переданы
      if (existingImages) {
        // Преобразуем в массив, если пришла строка
        const existingImagesArray = Array.isArray(existingImages)
          ? existingImages
          : [existingImages].filter(Boolean);
        updatedImages = [...existingImagesArray];
      }

      // Добавляем новые загруженные изображения
      if (req.files && req.files.length > 0) {
        console.log(
          "[serviceRoutes] Adding new images:",
          req.files.map((f) => f.filename)
        );
        const newImages = req.files.map((file) => file.filename);
        updatedImages = [...updatedImages, ...newImages];
      }

      // Обновляем массив изображений в предложении
      offer.images = updatedImages;

      // Для обратной совместимости обновляем поле image
      if (updatedImages.length > 0) {
        offer.image = updatedImages[0];
      }

      await offer.save();
      console.log("[serviceRoutes] Offer updated successfully:", offer._id);
      res.json(offer);
    } catch (error) {
      console.error("[serviceRoutes] Error updating offer:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// Удаление независимого предложения (доступно только provider и admin, которые его создали)
router.delete("/offers/:id", auth, async (req, res) => {
  try {
    if (!["provider", "admin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Providers and admins only." });
    }

    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    if (
      offer.providerId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Access denied. You can only delete your own offers." });
    }

    // Обновляем статистику категории перед удалением
    await categoryStatsService.decrementCategoryCount(offer.serviceType);

    await Favorite.deleteMany({ offerId: offer._id, offerType: "Offer" });
    await offer.deleteOne();

    res.json({ message: "Offer deleted" });
  } catch (error) {
    console.error("Error deleting offer:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Создание предложения на запрос (ServiceOffer, доступно только provider)
router.post(
  "/offer",
  auth,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: "Request ID, message, and price are required" });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { requestId, message, price } = req.body;
      if (!requestId || !message || !price) {
        return res
          .status(400)
          .json({ error: "Request ID, message, and price are required" });
      }
      const request = await ServiceRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      if (req.user.role !== "provider") {
        return res
          .status(403)
          .json({ error: "Access denied. Providers only." });
      }
      const offer = new ServiceOffer({
        requestId,
        providerId: req.user.id,
        message,
        price,
        image: req.file ? req.file.filename : null,
      });
      await offer.save();

      const notification = new Notification({
        userId: request.userId,
        message: `New offer received for your request: ${request.serviceType}`,
        type: "offer",
        relatedId: request._id,
      });
      await notification.save();

      res.status(201).json(offer);
    } catch (error) {
      console.error("Error creating ServiceOffer:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Получение запросов, на которые провайдер отправил предложения (ServiceOffer)
router.get("/provider-offers", auth, async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({ error: "Access denied. Providers only." });
    }
    const offers = await ServiceOffer.find({
      providerId: req.user.id,
    }).populate({
      path: "requestId",
      populate: { path: "userId", select: "name email phone address status" },
    });
    const requests = offers
      .map((offer) => offer.requestId)
      .filter((request) => request !== null);
    res.json(requests);
  } catch (error) {
    console.error("Error fetching provider offers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Создание запроса
router.post("/request", auth, async (req, res) => {
  try {
    const { serviceType, location, coordinates, description } = req.body;
    const request = new ServiceRequest({
      userId: req.user.id,
      serviceType,
      location,
      coordinates,
      description,
    });
    await request.save();
    res.status(201).json(request);
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение всех запросов с фильтрацией (доступно для авторизованных пользователей)
router.get("/requests", auth, async (req, res) => {
  try {
    const { providerId, offerId } = req.query;
    const query = {};

    // Проверяем права доступа - пользователи могут видеть только свои запросы или запросы к ним как к провайдеру
    if (req.user.role === "user") {
      // Обычный пользователь может видеть только свои запросы
      query.userId = req.user.id;
    } else if (req.user.role === "provider") {
      // Провайдер может видеть только запросы к нему
      query.providerId = req.user.id;
    } else if (req.user.role === "admin") {
      // Админ может видеть все запросы, но с фильтрацией
      if (providerId) query.providerId = providerId;
      if (offerId) query.offerId = offerId;
    }

    // Если указан providerId в запросе и пользователь - админ или запрашивает свои запросы
    if (
      providerId &&
      (req.user.role === "admin" || providerId === req.user.id)
    ) {
      query.providerId = providerId;
    }

    // Если указан offerId
    if (offerId) {
      query.offerId = offerId;
    }

    console.log("Fetching requests with query:", query);

    const requests = await ServiceRequest.find(query)
      .populate("userId", "name email")
      .populate("providerId", "name email")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Error fetching service requests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение запросов пользователя
router.get("/my-requests", auth, async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      userId: req.user.id,
    }).populate("userId", "name email phone address status");
    res.json(requests);
  } catch (error) {
    console.error("Error fetching my requests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение сообщений
router.get("/messages/:requestId", auth, async (req, res) => {
  const startTime = Date.now();
  console.log("=== GET MESSAGES REQUEST ===");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`User: ${req.user.id} (${req.user.name}, ${req.user.role})`);
  console.log(`RequestId: ${req.params.requestId}`);
  console.log(
    `Headers: ${JSON.stringify({
      authorization: req.headers.authorization ? "Bearer [REDACTED]" : "None",
      "content-type": req.headers["content-type"],
      "user-agent": req.headers["user-agent"],
    })}`
  );

  try {
    console.log("Fetching messages for request:", {
      requestId: req.params.requestId,
      userId: req.user.id,
      userRole: req.user.role,
    });

    // Проверяем валидность ID запроса
    if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
      console.error("Invalid request ID format:", req.params.requestId);
      return res.status(400).json({ error: "Invalid request ID format" });
    }

    // Проверяем существование запроса и права доступа
    const request = await ServiceRequest.findById(req.params.requestId)
      .populate("userId", "name email")
      .populate("providerId", "name email");

    if (!request) {
      console.log("Request not found, trying offer:", req.params.requestId);
      // Если запрос не найден, пробуем найти по offerId
      const offer = await Offer.findById(req.params.requestId);
      if (!offer) {
        console.error("Neither request nor offer found:", req.params.requestId);
        return res.status(404).json({ error: "Request not found" });
      }

      console.log("Found offer:", {
        id: offer._id,
        userId: offer.userId,
        providerId: offer.providerId,
      });

      // Проверяем права доступа для оффера
      const userIdStr = offer.userId.toString();
      const providerIdStr = offer.providerId.toString();
      const currentUserIdStr = req.user.id.toString();

      if (
        req.user.role === "user" &&
        userIdStr !== currentUserIdStr &&
        providerIdStr !== currentUserIdStr
      ) {
        console.warn("Access denied for user:", {
          userId: currentUserIdStr,
          requestUserId: userIdStr,
          requestProviderId: providerIdStr,
        });
        return res.status(403).json({ error: "Access denied" });
      }

      if (
        req.user.role === "provider" &&
        providerIdStr !== currentUserIdStr &&
        userIdStr !== currentUserIdStr
      ) {
        console.warn("Access denied for provider:", {
          providerId: currentUserIdStr,
          requestUserId: userIdStr,
          requestProviderId: providerIdStr,
        });
        return res.status(403).json({ error: "Access denied" });
      }

      // Ищем все сообщения, связанные с этим offerId
      console.log(
        `Searching for messages with offerId: ${req.params.requestId}`
      );
      const messages = await Message.find({
        $or: [
          { requestId: req.params.requestId },
          { offerId: req.params.requestId },
        ],
      }).populate("senderId", "name status");

      console.log(
        `Found ${messages.length} messages for offer. First few messages:`
      );
      messages.slice(0, 3).forEach((msg, i) => {
        console.log(`Message ${i + 1}:`, {
          id: msg._id,
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          message:
            msg.message &&
            msg.message.substring(0, 30) +
              (msg.message.length > 30 ? "..." : ""),
          timestamp: msg.timestamp,
          requestId: msg.requestId,
        });
      });

      const endTime = Date.now();
      console.log(`Request completed in ${endTime - startTime}ms`);
      console.log("=== END MESSAGES REQUEST ===");

      return res.json(messages);
    }

    console.log("Found request:", {
      id: request._id,
      userId: request.userId?._id,
      providerId: request.providerId?._id,
    });

    // Проверяем наличие userId и providerId в запросе
    if (!request.userId || !request.providerId) {
      console.error("Request missing user or provider ID:", {
        requestId: request._id,
        hasUserId: !!request.userId,
        hasProviderId: !!request.providerId,
      });
      return res.status(400).json({ error: "Request data is incomplete" });
    }

    // Проверяем права доступа
    const userIdStr = request.userId._id.toString();
    const providerIdStr = request.providerId._id.toString();
    const currentUserIdStr = req.user.id.toString();

    console.log("Checking access rights:", {
      currentUserId: currentUserIdStr,
      requestUserId: userIdStr,
      requestProviderId: providerIdStr,
      userRole: req.user.role,
    });

    if (
      req.user.role === "user" &&
      userIdStr !== currentUserIdStr &&
      providerIdStr !== currentUserIdStr
    ) {
      console.warn("Access denied for user:", {
        userId: currentUserIdStr,
        requestUserId: userIdStr,
        requestProviderId: providerIdStr,
      });
      return res.status(403).json({ error: "Access denied" });
    }

    if (
      req.user.role === "provider" &&
      providerIdStr !== currentUserIdStr &&
      userIdStr !== currentUserIdStr
    ) {
      console.warn("Access denied for provider:", {
        providerId: currentUserIdStr,
        requestUserId: userIdStr,
        requestProviderId: providerIdStr,
      });
      return res.status(403).json({ error: "Access denied" });
    }

    // Получаем сообщения
    console.log(
      `Searching for messages with requestId: ${req.params.requestId}`
    );
    const messages = await Message.find({
      $or: [
        { requestId: req.params.requestId },
        { offerId: req.params.requestId },
      ],
    }).populate("senderId", "name status");

    console.log(
      `Found ${messages.length} messages for request. First few messages:`
    );
    messages.slice(0, 3).forEach((msg, i) => {
      console.log(`Message ${i + 1}:`, {
        id: msg._id,
        senderId: msg.senderId
          ? (msg.senderId._id || msg.senderId).toString()
          : "null",
        recipientId: msg.recipientId ? msg.recipientId.toString() : "null",
        message:
          msg.message &&
          msg.message.substring(0, 30) + (msg.message.length > 30 ? "..." : ""),
        timestamp: msg.timestamp,
        requestId: msg.requestId ? msg.requestId.toString() : "null",
      });
    });

    // Проверка структуры сообщений перед отправкой
    const safeMessages = messages.map((msg) => {
      // Убедимся, что все ID преобразованы в строки для консистентности
      const formattedMsg = {
        ...msg.toObject(),
        _id: msg._id.toString(),
        requestId: msg.requestId ? msg.requestId.toString() : null,
        senderId: msg.senderId
          ? typeof msg.senderId === "object"
            ? msg.senderId._id
              ? msg.senderId._id.toString()
              : null
            : msg.senderId.toString()
          : null,
        recipientId: msg.recipientId ? msg.recipientId.toString() : null,
      };
      return formattedMsg;
    });

    const endTime = Date.now();
    console.log(`Request completed in ${endTime - startTime}ms`);
    console.log("=== END MESSAGES REQUEST ===");

    res.json(safeMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Отправка сообщения в чате запроса
router.post("/messages/:requestId", auth, async (req, res) => {
  const startTime = Date.now();
  console.log("=== POST MESSAGE REQUEST ===");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`User: ${req.user.id} (${req.user.name}, ${req.user.role})`);
  console.log(`RequestId: ${req.params.requestId}`);
  console.log(`Request Body:`, {
    messageLength: req.body.message ? req.body.message.length : 0,
    messageSample: req.body.message
      ? req.body.message.substring(0, 30) +
        (req.body.message.length > 30 ? "..." : "")
      : null,
    recipientId: req.body.recipientId,
  });

  try {
    const { message, recipientId } = req.body;

    if (!message || !recipientId) {
      console.error("Missing required fields:", {
        message: !!message,
        recipientId: !!recipientId,
      });
      return res
        .status(400)
        .json({ error: "Message and recipientId are required" });
    }

    // Проверяем валидность ObjectId запроса
    if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
      console.error("Invalid request ID format:", req.params.requestId);
      return res.status(400).json({ error: "Invalid request ID format" });
    }

    // Нормализуем recipientId, если это необходимо
    let normalizedRecipientId = recipientId;
    if (typeof recipientId === "object") {
      if (recipientId._id) {
        normalizedRecipientId = recipientId._id.toString();
      } else {
        console.error("Invalid recipientId format:", recipientId);
        return res.status(400).json({ error: "Invalid recipientId format" });
      }
    }

    console.log("Normalized recipientId:", normalizedRecipientId);

    // Проверяем существование запроса или оффера
    let requestOrOffer = null;
    let entityType = "";

    // Сначала ищем запрос
    const request = await ServiceRequest.findById(req.params.requestId);
    if (request) {
      requestOrOffer = request;
      entityType = "request";
      console.log("Found request:", {
        id: request._id,
        userId: request.userId,
        providerId: request.providerId,
        status: request.status,
      });
    } else {
      // Если запрос не найден, пробуем найти оффер
      const offer = await Offer.findById(req.params.requestId);
      if (offer) {
        requestOrOffer = offer;
        entityType = "offer";
        console.log("Found offer:", {
          id: offer._id,
          userId: offer.userId,
          providerId: offer.providerId,
          title: offer.title,
        });
      } else {
        console.error("Neither request nor offer found:", req.params.requestId);
        return res.status(404).json({ error: "Request or offer not found" });
      }
    }

    // Проверяем права доступа
    const userIdStr = requestOrOffer.userId.toString();
    const providerIdStr = requestOrOffer.providerId.toString();
    const currentUserIdStr = req.user.id.toString();

    console.log("Checking access rights:", {
      userIdStr,
      providerIdStr,
      currentUserIdStr,
      userRole: req.user.role,
    });

    if (
      req.user.role === "user" &&
      userIdStr !== currentUserIdStr &&
      providerIdStr !== currentUserIdStr
    ) {
      console.warn("Access denied for user:", {
        userId: currentUserIdStr,
        entityUserId: userIdStr,
        entityProviderId: providerIdStr,
      });
      return res.status(403).json({ error: "Access denied" });
    }

    if (
      req.user.role === "provider" &&
      providerIdStr !== currentUserIdStr &&
      userIdStr !== currentUserIdStr
    ) {
      console.warn("Access denied for provider:", {
        providerId: currentUserIdStr,
        entityUserId: userIdStr,
        entityProviderId: providerIdStr,
      });
      return res.status(403).json({ error: "Access denied" });
    }

    // Создаем новое сообщение с полем requestId
    const messageData = {
      senderId: req.user.id,
      recipientId: normalizedRecipientId,
      message,
    };

    // Устанавливаем соответствующее поле в зависимости от типа сущности
    if (entityType === "request") {
      messageData.requestId = req.params.requestId;
    } else {
      messageData.offerId = req.params.requestId;
    }

    console.log("Creating message with data:", {
      ...messageData,
      message:
        messageData.message.substring(0, 30) +
        (messageData.message.length > 30 ? "..." : ""),
    });

    const newMessage = await Message.create(messageData);

    console.log("Created new message:", {
      id: newMessage._id,
      senderId: newMessage.senderId,
      recipientId: newMessage.recipientId,
      requestId: newMessage.requestId,
      offerId: newMessage.offerId,
      messageLength: newMessage.message.length,
    });

    // Отправляем через WebSocket
    const io = require("../socket").getIO();
    io.to(normalizedRecipientId).emit("private_message", {
      ...newMessage.toObject(),
      senderName: req.user.name,
    });

    console.log(
      `WebSocket: Emitted 'private_message' to ${normalizedRecipientId}`
    );

    // Отправляем уведомление о новом сообщении
    await NotificationService.sendNotification(normalizedRecipientId, {
      type: "message",
      message: `Новое сообщение от ${req.user.name}`,
      relatedId: newMessage._id,
      senderId: req.user.id,
      requestId: messageData.requestId || null,
      offerId: messageData.offerId || null,
    });

    console.log(`Notification: Sent to ${normalizedRecipientId}`);

    const endTime = Date.now();
    console.log(`Request completed in ${endTime - startTime}ms`);
    console.log("=== END POST MESSAGE REQUEST ===");

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Добавление/удаление предложения из избранного (доступно только авторизованным пользователям)
router.post("/favorites", auth, async (req, res) => {
  try {
    const { offerId, offerType } = req.body;
    console.log("Received toggle favorite request:", {
      offerId,
      offerType,
      userId: req.user.id,
    });

    // Проверяем входные данные
    if (!offerId || !offerType) {
      return res.status(400).json({ error: "Offer ID and type are required" });
    }

    if (!["Offer", "ServiceOffer"].includes(offerType)) {
      return res.status(400).json({ error: "Invalid offer type" });
    }

    // Проверяем существование предложения
    const Model = offerType === "Offer" ? Offer : ServiceOffer;
    const offer = await Model.findById(offerId);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Проверяем, существует ли уже запись в избранном
    const existingFavorite = await Favorite.findOne({
      userId: req.user.id,
      offerId,
      offerType,
    });

    if (existingFavorite) {
      console.log("Removing from favorites:", {
        offerId,
        offerType,
        favoriteId: existingFavorite._id,
      });
      await Favorite.deleteOne({ _id: existingFavorite._id });
      res.json({ message: "Removed from favorites", isFavorite: false });
    } else {
      console.log("Adding to favorites:", { offerId, offerType });
      const favorite = new Favorite({
        userId: req.user.id,
        offerId,
        offerType,
      });
      await favorite.save();
      res.json({ message: "Added to favorites", isFavorite: true });
    }
  } catch (error) {
    console.error("Error toggling favorite:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: "Server error" });
  }
});

// Получение избранных предложений пользователя
router.get("/favorites", auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id });
    const favoriteOffers = [];

    for (const favorite of favorites) {
      const Model = favorite.offerType === "Offer" ? Offer : ServiceOffer;
      const offer = await Model.findById(favorite.offerId);
      if (offer && offer.status === "active") {
        favoriteOffers.push({
          ...offer._doc,
          type: favorite.offerType,
        });
      }
    }

    res.json(favoriteOffers);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Удаление избранного предложения по ID
router.delete("/favorites/:id", auth, async (req, res) => {
  try {
    const offerId = req.params.id;
    console.log("Removing from favorites by ID:", {
      offerId,
      userId: req.user.id,
    });

    // Проверяем, существует ли запись в избранном с этим ID предложения
    const existingFavorite = await Favorite.findOne({
      userId: req.user.id,
      offerId,
    });

    if (!existingFavorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    await Favorite.deleteOne({ _id: existingFavorite._id });
    res.json({ message: "Removed from favorites", isFavorite: false });
  } catch (error) {
    console.error("Error removing from favorites:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: "Server error" });
  }
});

// Получение уведомлений пользователя
router.get("/notifications", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Пометить уведомление как прочитанное
router.put("/notifications/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение списка провайдеров (доступно только admin)
router.get("/providers", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const providers = await User.find({ role: "provider" }, "name email _id");
    res.json(providers);
  } catch (error) {
    console.error("Error fetching providers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение списка чатов пользователя
router.get("/my-chats", auth, async (req, res) => {
  try {
    console.log("Fetching chats for user:", req.user.id);

    // Получаем все запросы пользователя
    const userRequests = await ServiceRequest.find({
      userId: req.user.id,
    }).populate("userId", "name email phone address status");
    console.log("Found user requests:", userRequests.length);

    // Получаем все сообщения пользователя
    const userMessages = await Message.find({
      $or: [{ senderId: req.user.id }, { recipientId: req.user.id }],
    });
    console.log("Found user messages:", userMessages.length);

    // Находим id запросов, по которым есть сообщения
    const requestIdsWithMessages = [
      ...new Set(
        userMessages
          .filter((msg) => msg.requestId) // Убеждаемся, что requestId существует
          .map((msg) => msg.requestId.toString())
      ),
    ];
    console.log("Request IDs with messages:", requestIdsWithMessages);

    // Фильтруем запросы
    const chats = userRequests.filter((request) =>
      requestIdsWithMessages.includes(request._id.toString())
    );
    console.log("Final chats count:", chats.length);

    res.json(chats);
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение списка чатов провайдера
router.get("/provider-chats", auth, async (req, res) => {
  try {
    console.log(
      "Fetching provider chats for user:",
      req.user.id,
      "role:",
      req.user.role
    );

    if (!["provider", "admin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Providers and admins only." });
    }

    // Получаем все сообщения, где пользователь является отправителем или получателем
    const userMessages = await Message.find({
      $or: [{ senderId: req.user.id }, { recipientId: req.user.id }],
    });
    console.log("Found provider messages:", userMessages.length);

    // Находим уникальные ID запросов из сообщений
    const requestIds = [
      ...new Set(
        userMessages
          .filter((msg) => msg.requestId)
          .map((msg) => msg.requestId.toString())
      ),
    ];
    console.log("Found request IDs:", requestIds);

    // Получаем все запросы по найденным ID
    const requests = await ServiceRequest.find({
      _id: { $in: requestIds },
      userId: { $ne: req.user.id }, // Исключаем собственные запросы пользователя
    }).populate("userId", "name email phone address status");
    console.log("Final provider chats count:", requests.length);

    res.json(requests);
  } catch (error) {
    console.error("Error fetching provider chats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Создание запроса на услугу (доступно для авторизованных пользователей)
router.post("/requests", auth, async (req, res) => {
  try {
    const { providerId, offerId, serviceType, message } = req.body;

    // Проверка обязательных полей
    if (!providerId || !serviceType) {
      return res
        .status(400)
        .json({ error: "Provider ID and service type are required" });
    }

    // Создание запроса
    const newRequest = new ServiceRequest({
      userId: req.user.id,
      providerId,
      offerId, // Может быть undefined, если запрос не связан с конкретным предложением
      serviceType,
      description: message || "",
      status: "pending",
    });

    await newRequest.save();
    console.log("Created new service request:", {
      id: newRequest._id,
      userId: newRequest.userId,
      providerId: newRequest.providerId,
      serviceType: newRequest.serviceType,
    });

    // Отправляем уведомление провайдеру
    const io = require("../socket").getIO();
    io.to(providerId).emit("new_request", {
      requestId: newRequest._id,
      message: `New service request from ${req.user.name}`,
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Error creating service request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение количества предложений по категориям
router.get("/categories/counts", categoryController.getCategoryCounts);

// GET /categories/stats - получить статистику по категориям
router.get("/categories/stats", categoryController.getCategoryStats);

// Новый маршрут для получения топ-категорий
router.get("/categories/top", categoryController.getTopCategories);

// Поднятие объявления в топ
router.post("/offers/:id/promote", auth, async (req, res) => {
  try {
    const { promotionType } = req.body;
    const offerId = req.params.id;

    // Проверяем валидность ObjectId
    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({ error: "Invalid offer ID format" });
    }

    console.log("[Promotion] Received promotion request:", {
      offerId,
      userId: req.user.id,
      promotionType,
      body: req.body,
    });

    // Валидация типа поднятия
    if (!promotionType || !["DAY", "WEEK"].includes(promotionType)) {
      console.log("[Promotion] Invalid promotion type:", promotionType);
      return res
        .status(400)
        .json({ error: "Invalid promotion type. Must be 'DAY' or 'WEEK'" });
    }

    // Проверяем существование предложения
    const offer = await Offer.findById(offerId).lean();
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Проверяем права доступа
    if (offer.providerId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only promote your own offers" });
    }

    // Вызываем сервис для продвижения
    const result = await promotionService.promoteOffer(
      offerId,
      promotionType,
      req.user.id
    );

    console.log("[Promotion] Promotion successful:", result);
    res.json(result);
  } catch (error) {
    console.error("[Promotion] Error promoting offer:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Если это ошибка валидации, возвращаем детали
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    // Если это наша ApiError, используем её статус
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }

    // Для всех остальных ошибок
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Проверка статуса поднятия
router.get("/offers/:id/promotion-status", async (req, res) => {
  const id = req.params.id;
  console.log(`[Promotion] Checking status for offer: ${id}`);

  try {
    // Проверяем валидность ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`[Promotion] Invalid offer ID format: ${id}`);
      return res.status(400).json({
        error: "Invalid offer ID format",
        isPromoted: false,
      });
    }

    const status = await promotionService.checkPromotionStatus(id);
    console.log(`[Promotion] Status for offer ${id}:`, status);
    res.json(status);
  } catch (error) {
    console.error(`[Promotion] Error checking promotion status for ${id}:`, {
      error: error.message,
      stack: error.stack,
    });

    // Отправляем корректный статус ошибки и объект с сообщением об ошибке
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      error: error.message,
      isPromoted: false,
    });
  }
});

// Тестовый маршрут для проверки доступа к изображениям
router.get("/check-images", (req, res) => {
  try {
    const imagesDir = path.join(__dirname, "..", "uploads", "images");
    const files = fs.readdirSync(imagesDir);

    res.json({
      success: true,
      message: "Изображения доступны",
      imagesCount: files.length,
      sampleImages: files.slice(0, 5),
      uploadsPath: UPLOADS_PATH,
      baseUrl: BASE_URL,
    });
  } catch (error) {
    console.error("Error checking images:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

// Обновление статуса предложения
router.put("/offers/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const offerId = req.params.id;

    // Проверяем валидность статуса
    const validStatuses = ["active", "completed", "cancelled", "inactive"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Находим предложение
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Проверяем права доступа (только владелец или админ могут менять статус)
    if (
      req.user.role !== "admin" &&
      offer.providerId.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Если предложение завершается, обновляем статистику провайдера
    if (status === "completed" && offer.status !== "completed") {
      const provider = await User.findById(offer.providerId);
      if (provider) {
        await provider.incrementCompletedOffers();
      }
    }

    // Обновляем статус
    offer.status = status;
    await offer.save();

    res.json({ message: "Status updated successfully", offer });
  } catch (error) {
    console.error("Error updating offer status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение запроса чата по ID
router.get("/requests/:id", auth, async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;

    console.log(
      `[GET /requests/${requestId}] Request info requested by user: ${userId}`
    );

    // Проверка валидности ID
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid request ID format" });
    }

    // Находим запрос
    const request = await ServiceRequest.findById(requestId)
      .populate("userId", "name _id")
      .populate("providerId", "name _id")
      .populate({
        path: "offerId",
        select: "title serviceType",
      });

    if (!request) {
      console.log(`[GET /requests/${requestId}] Request not found`);
      return res.status(404).json({ error: "Request not found" });
    }

    console.log(`[GET /requests/${requestId}] Found request:`, {
      id: request._id,
      userId: request.userId._id.toString(),
      providerId: request.providerId._id.toString(),
      status: request.status,
    });

    // Проверяем права доступа (пользователь должен быть либо автором запроса, либо провайдером)
    const userIdStr = userId.toString();
    const requestUserIdStr = request.userId._id.toString();
    const requestProviderIdStr = request.providerId._id.toString();

    console.log(`[GET /requests/${requestId}] Checking access:`, {
      userId: userIdStr,
      requestUserId: requestUserIdStr,
      requestProviderId: requestProviderIdStr,
    });

    if (userIdStr !== requestUserIdStr && userIdStr !== requestProviderIdStr) {
      console.log(
        `[GET /requests/${requestId}] Access denied for user: ${userIdStr}`
      );
      return res.status(403).json({ error: "Access denied" });
    }

    // Если дошли сюда, значит доступ разрешен
    console.log(
      `[GET /requests/${requestId}] Access granted to user: ${userIdStr}`
    );

    // Формируем объект с информацией о запросе, который будет совместим с ChatRequest
    const chatRequestData = {
      _id: request._id,
      userId: request.userId,
      providerId: request.providerId,
      offerId: request.offerId,
      serviceType: request.serviceType,
      description: request.description,
      status: request.status,
      createdAt: request.createdAt,
      // Добавляем поля, совместимые с форматом ChatRequest
      service: request.offerId
        ? {
            title: request.offerId.title,
            type: request.offerId.serviceType,
          }
        : {
            title: request.description,
            type: request.serviceType,
          },
    };

    res.json(chatRequestData);
  } catch (error) {
    console.error(`[GET /requests/${req.params.id}] Error:`, error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;
