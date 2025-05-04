const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { isProvider, isAdmin } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinaryConfig");
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
const { UPLOADS_PATH } = require("../config/uploadConfig");

// Базовый URL бэкенда
const BASE_URL = "http://localhost:5001";

router.use((req, res, next) => {
  if (req.url.startsWith("/reviews")) {
    return next("route");
  }
  console.log("[SERVICE ROUTES] CATCH-ALL:", req.method, req.originalUrl);
  next();
});

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
          if (
            offer.image.startsWith("http://") ||
            offer.image.startsWith("https://")
          ) {
            formattedOffer.image = offer.image;
          } else {
            formattedOffer.image = `${BASE_URL}${UPLOADS_PATH}/${offer.image}`;
          }
        }
        if (offer.images && offer.images.length > 0) {
          formattedOffer.images = offer.images.map((image) =>
            image
              ? image.startsWith("http://") || image.startsWith("https://")
                ? image
                : `${BASE_URL}${UPLOADS_PATH}/${image}`
              : "https://via.placeholder.com/150?text=Offer"
          );
        } else {
          formattedOffer.images = [];
        }
        return formattedOffer;
      })
    );

    res.json({
      offers: formattedOffers,
      total: totalOffers,
      pages: totalPages,
      page: page,
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
        if (
          offer.image.startsWith("http://") ||
          offer.image.startsWith("https://")
        ) {
          formattedOffer.image = offer.image;
        } else {
          formattedOffer.image = `${BASE_URL}${UPLOADS_PATH}/${offer.image}`;
        }
      }
      if (offer.images && offer.images.length > 0) {
        formattedOffer.images = offer.images.map((image) =>
          image
            ? image.startsWith("http://") || image.startsWith("https://")
              ? image
              : `${BASE_URL}${UPLOADS_PATH}/${image}`
            : "https://via.placeholder.com/150?text=Offer"
        );
      } else {
        formattedOffer.images = [];
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
        if (
          offer.image.startsWith("http://") ||
          offer.image.startsWith("https://")
        ) {
          offerData.image = offer.image;
        } else {
          offerData.image = `${BASE_URL}${UPLOADS_PATH}/${offer.image}`;
        }
      }
      if (Array.isArray(offer.images)) {
        offerData.images = offer.images.map((image) =>
          image
            ? image.startsWith("http://") || image.startsWith("https://")
              ? image
              : `${BASE_URL}${UPLOADS_PATH}/${image}`
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

      if (!title || !category || !location || !description) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Проверяем наличие ценовой информации
      if (isPriceRange === "true") {
        if (!priceFrom || !priceTo) {
          return res.status(400).json({
            error: "Price range requires both minimum and maximum values",
          });
        }
      } else {
        if (!price) {
          return res.status(400).json({ error: "Price is required" });
        }
      }

      const actualProviderId = providerId || req.user.id;
      const provider = await User.findById(actualProviderId);

      if (
        !provider ||
        (provider.role !== "provider" && provider.role !== "admin")
      ) {
        return res.status(400).json({ error: "Invalid provider" });
      }

      // Получаем URLs изображений из Cloudinary
      const images = req.files ? req.files.map((file) => file.path) : [];

      const offer = new Offer({
        title,
        providerId: actualProviderId,
        serviceType: category,
        category,
        location,
        description,
        price: isPriceRange === "true" ? undefined : price,
        priceFrom: isPriceRange === "true" ? priceFrom : undefined,
        priceTo: isPriceRange === "true" ? priceTo : undefined,
        isPriceRange: isPriceRange === "true",
        images,
        image: images[0], // Для обратной совместимости
      });

      await offer.save();
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

      if (
        offer.providerId.toString() !== req.user.id &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          message: "У вас нет доступа к редактированию этого предложения",
        });
      }

      // Обновляем поля
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

      // Добавляем существующие изображения
      if (existingImages) {
        const existingImagesArray = Array.isArray(existingImages)
          ? existingImages
          : [existingImages].filter(Boolean);
        updatedImages = [...existingImagesArray];
      }

      // Добавляем новые изображения из Cloudinary
      if (req.files && req.files.length > 0) {
        console.log(
          "[serviceRoutes] Adding new images:",
          req.files.map((f) => f.path)
        );
        const newImages = req.files.map((file) => file.path);
        updatedImages = [...updatedImages, ...newImages];
      }

      offer.images = updatedImages;
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

// Создание запроса на услугу (доступно для авторизованных пользователей)
router.post("/requests", auth, async (req, res) => {
  try {
    const io = require("../socket").getIO();
    console.log("[POST /requests] Incoming body:", JSON.stringify(req.body));
    const { providerId, offerId, serviceType, message } = req.body;

    // Проверка обязательных полей
    if (!serviceType) {
      return res.status(400).json({ error: "Service type is required" });
    }
    // if (!message) {
    //   return res.status(400).json({ error: "Description is required" });
    // }

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
    console.log(
      "[POST /requests] Saved ServiceRequest:",
      newRequest.toObject()
    );

    // Получаем имя пользователя для уведомления
    let userName = req.user.name;
    if (!userName) {
      const userFromDb = await User.findById(req.user.id).select("name");
      userName = userFromDb ? userFromDb.name : "Пользователь";
    }

    // Отправляем уведомление провайдеру, если providerId указан
    if (providerId) {
      const notificationPayload = {
        type: "request",
        message: `Новый запрос от ${userName}`,
        relatedId: newRequest._id,
      };
      console.log("[POST /requests] About to send notification:", {
        providerId,
        notificationPayload,
      });
      try {
        const notificationResult = await NotificationService.sendNotification(
          providerId,
          notificationPayload
        );
        console.log(
          "[POST /requests] NotificationService result:",
          notificationResult
        );
      } catch (notifErr) {
        console.error(
          "[POST /requests] Error in NotificationService:",
          notifErr
        );
      }
    } else {
      // Общий запрос — отправить всем провайдерам уведомление и событие по сокету
      const providers = await User.find({ role: "provider" }, "_id");
      for (const provider of providers) {
        // Создаём уведомление в базе и отправляем по сокету
        const notificationPayload = {
          type: "request",
          message: `Новый общий запрос от ${userName}`,
          relatedId: newRequest._id,
        };
        try {
          await NotificationService.sendNotification(
            provider._id.toString(),
            notificationPayload
          );
        } catch (notifErr) {
          console.error(
            `[POST /requests] Error sending notification to provider ${provider._id}:`,
            notifErr
          );
        }
      }
    }

    // Отправляем уведомление через сокет (старый вариант)
    if (providerId) {
      io.to(providerId).emit("new_request", {
        requestId: newRequest._id,
        message: `New service request from ${req.user.name || "Пользователь"}`,
      });
    }

    res.status(201).json(newRequest);
  } catch (error) {
    console.error("[POST /requests] Error creating service request:", error);
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
      .populate("userId", "name email phone status")
      .populate("providerId", "name email phone status")
      .populate({
        path: "offerId",
        select: "title serviceType",
      });

    console.log(
      `[GET /requests/${req.params.requestId}] raw request:`,
      request
    );
    if (request) {
      console.log(
        `[GET /requests/${req.params.requestId}] userId:`,
        request.userId
      );
      console.log(
        `[GET /requests/${req.params.requestId}] providerId:`,
        request.providerId
      );
    }

    if (!request) {
      console.log(`[GET /requests/${req.params.requestId}] Request not found`);
      return res.status(404).json({ error: "Request not found" });
    }

    // Безопасно логируем найденный запрос
    console.log(`[GET /requests/${req.params.requestId}] Found request:`, {
      id: request._id,
      userId:
        request.userId && request.userId._id
          ? request.userId._id.toString()
          : null,
      providerId:
        request.providerId && request.providerId._id
          ? request.providerId._id.toString()
          : null,
      status: request.status,
    });

    // Проверяем наличие userId и providerId в запросе
    if (!request.userId) {
      console.error("Request missing userId:", {
        requestId: request._id,
        hasUserId: !!request.userId,
        hasProviderId: !!request.providerId,
      });
      return res.status(400).json({ error: "Request data is incomplete" });
    }

    // Безопасно получаем userId и providerId
    const userIdObj =
      request.userId && request.userId._id
        ? request.userId._id.toString()
        : null;
    const providerIdObj =
      request.providerId && request.providerId._id
        ? request.providerId._id.toString()
        : null;
    const userIdStr = req.user.id.toString();

    // Проверяем права доступа (пользователь должен быть либо автором запроса, либо провайдером, если он есть)
    console.log("Checking access rights for request details (patched):", {
      userIdStr,
      userIdObj,
      providerIdObj,
      role: req.user.role,
    });
    if (
      userIdStr !== userIdObj &&
      providerIdObj &&
      userIdStr !== providerIdObj
    ) {
      console.log(
        `[GET /requests/${req.params.requestId}] Access denied for user: ${userIdStr}`
      );
      return res.status(403).json({ error: "Access denied" });
    }
    if (req.user.role === "provider" && !providerIdObj) {
      // Общий запрос — разрешаем доступ любому провайдеру
      console.log(
        `[GET /requests/${req.params.requestId}] Access granted for provider to general request: ${userIdStr}`
      );
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
    const providerIdStr = requestOrOffer.providerId
      ? requestOrOffer.providerId.toString()
      : null;
    const currentUserIdStr = req.user.id.toString();
    console.log("Checking access rights (patched):", {
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
      providerIdStr &&
      providerIdStr !== currentUserIdStr &&
      userIdStr !== currentUserIdStr
    ) {
      console.warn("Access denied for provider (personal request):", {
        providerId: currentUserIdStr,
        entityUserId: userIdStr,
        entityProviderId: providerIdStr,
      });
      return res.status(403).json({ error: "Access denied" });
    }
    if (req.user.role === "provider" && !providerIdStr) {
      // Общий запрос — разрешаем доступ любому провайдеру
      console.log(
        "Access granted for provider to general request (send message):",
        {
          providerId: currentUserIdStr,
          requestId: requestOrOffer._id,
        }
      );
    }

    // Создаем новое сообщение с полем requestId
    const messageData = {
      senderId: req.user.id,
      recipientId: normalizedRecipientId,
      message,
    };

    // Логируем recipientId и userId автора запроса для диагностики
    if (entityType === "request") {
      messageData.requestId = req.params.requestId;
      console.log("[DIAG] POST /messages/:requestId: entityType=request", {
        recipientId: normalizedRecipientId,
        requestUserId:
          requestOrOffer.userId?.toString?.() || requestOrOffer.userId,
        senderId: req.user.id,
        requestId: req.params.requestId,
      });
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
    const notifPayload = {
      type: "message",
      message: `Новое сообщение от ${req.user.name || "Пользователь"}`,
      relatedId: newMessage._id,
      senderId: req.user.id,
      requestId: messageData.requestId || null,
      offerId: messageData.offerId || null,
    };
    console.log("[DIAG] NotificationService.sendNotification call", {
      recipientId: normalizedRecipientId,
      notifPayload,
    });
    await NotificationService.sendNotification(
      normalizedRecipientId,
      notifPayload
    );
    console.log(`[DIAG] NotificationService: sent to ${normalizedRecipientId}`);

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
    if (!["admin", "user"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied." });
    }
    const providers = await User.find(
      { role: "provider" },
      "name email _id status"
    );
    res.json(providers);
  } catch (error) {
    console.error("Error fetching providers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение списка чатов пользователя
router.get("/my-chats", auth, async (req, res) => {
  try {
    console.log("[my-chats] Fetching chats for user:", req.user.id);

    // Получаем все сообщения пользователя (где он отправитель или получатель)
    const userMessages = await Message.find({
      $or: [{ senderId: req.user.id }, { recipientId: req.user.id }],
    });
    console.log("[my-chats] Found user messages:", userMessages.length);

    // Группируем по (requestId, providerId)
    const chatMap = new Map();
    for (const msg of userMessages) {
      const requestId = msg.requestId ? msg.requestId.toString() : null;
      if (!requestId) continue;
      // Определяем providerId для этого сообщения
      let providerId = null;
      if (msg.senderId.toString() === req.user.id && msg.recipientId) {
        // Если пользователь отправитель, ищем провайдера среди получателей
        const recipient = await User.findById(msg.recipientId).select("role");
        if (recipient && recipient.role === "provider") {
          providerId = msg.recipientId.toString();
        }
      } else if (msg.recipientId.toString() === req.user.id && msg.senderId) {
        // Если пользователь получатель, ищем провайдера среди отправителей
        const sender = await User.findById(msg.senderId).select("role");
        if (sender && sender.role === "provider") {
          providerId = msg.senderId.toString();
        }
      }
      if (!providerId) continue;
      const key = `${requestId}_${providerId}`;
      if (!chatMap.has(key)) {
        chatMap.set(key, { requestId, providerId });
      }
    }

    // Собираем инфу о провайдерах
    const chatList = [];
    for (const { requestId, providerId } of chatMap.values()) {
      const provider = await User.findById(providerId).select(
        "_id name email status"
      );
      chatList.push({
        requestId,
        providerId,
        userId: req.user.id,
        provider: provider
          ? {
              _id: provider._id,
              name: provider.name,
              email: provider.email,
              status: provider.status,
            }
          : null,
      });
    }
    console.log("[my-chats] Final chat list:", chatList.length);
    res.json(chatList);
  } catch (error) {
    console.error("[my-chats] Error fetching user chats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение списка чатов провайдера
router.get("/provider-chats", auth, async (req, res) => {
  try {
    console.log(
      "[provider-chats] Fetching provider chats for user:",
      req.user.id,
      "role:",
      req.user.role
    );

    if (!["provider", "admin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Providers and admins only." });
    }

    // Получаем все сообщения, где провайдер является отправителем или получателем
    const providerMessages = await Message.find({
      $or: [{ senderId: req.user.id }, { recipientId: req.user.id }],
    });
    console.log(
      "[provider-chats] Found provider messages:",
      providerMessages.length
    );

    // Группируем по (requestId, userId)
    const chatMap = new Map();
    for (const msg of providerMessages) {
      const requestId = msg.requestId ? msg.requestId.toString() : null;
      if (!requestId) continue;
      // Определяем userId для этого сообщения
      let userId = null;
      if (msg.senderId.toString() === req.user.id && msg.recipientId) {
        // Если провайдер отправитель, ищем пользователя среди получателей
        const recipient = await User.findById(msg.recipientId).select("role");
        if (recipient && recipient.role === "user") {
          userId = msg.recipientId.toString();
        }
      } else if (msg.recipientId.toString() === req.user.id && msg.senderId) {
        // Если провайдер получатель, ищем пользователя среди отправителей
        const sender = await User.findById(msg.senderId).select("role");
        if (sender && sender.role === "user") {
          userId = msg.senderId.toString();
        }
      }
      if (!userId) continue;
      const key = `${requestId}_${userId}`;
      if (!chatMap.has(key)) {
        chatMap.set(key, { requestId, userId });
      }
    }

    // Собираем инфу о пользователях
    const chatList = [];
    for (const { requestId, userId } of chatMap.values()) {
      const user = await User.findById(userId).select("_id name email status");
      chatList.push({
        requestId,
        providerId: req.user.id,
        userId,
        user: user
          ? {
              _id: user._id,
              name: user.name,
              email: user.email,
              status: user.status,
            }
          : null,
      });
    }
    console.log("[provider-chats] Final chat list:", chatList.length);
    res.json(chatList);
  } catch (error) {
    console.error("[provider-chats] Error fetching provider chats:", error);
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
      .populate("userId", "name _id email phone status")
      .populate("providerId", "name _id email phone status")
      .populate({
        path: "offerId",
        select: "title serviceType",
      });

    console.log(`[GET /requests/${requestId}] raw request:`, request);
    if (request) {
      console.log(`[GET /requests/${requestId}] userId:`, request.userId);
      console.log(
        `[GET /requests/${requestId}] providerId:`,
        request.providerId
      );
    }

    if (!request) {
      console.log(`[GET /requests/${requestId}] Request not found`);
      return res.status(404).json({ error: "Request not found" });
    }

    console.log(`[GET /requests/${requestId}] Found request:`, {
      id: request._id,
      userId:
        request.userId && request.userId._id
          ? request.userId._id.toString()
          : null,
      providerId:
        request.providerId && request.providerId._id
          ? request.providerId._id.toString()
          : null,
      status: request.status,
    });

    // Безопасно получаем userId и providerId
    const userIdObj =
      request.userId && request.userId._id
        ? request.userId._id.toString()
        : null;
    const providerIdObj =
      request.providerId && request.providerId._id
        ? request.providerId._id.toString()
        : null;
    const userIdStr = userId.toString();

    // Проверяем права доступа (пользователь должен быть либо автором запроса, либо провайдером, если он есть)
    console.log("Checking access rights for request details (patched):", {
      userIdStr,
      userIdObj,
      providerIdObj,
      role: req.user.role,
    });
    if (
      userIdStr !== userIdObj &&
      providerIdObj &&
      userIdStr !== providerIdObj
    ) {
      console.log(
        `[GET /requests/${requestId}] Access denied for user: ${userIdStr}`
      );
      return res.status(403).json({ error: "Access denied" });
    }
    if (req.user.role === "provider" && !providerIdObj) {
      // Общий запрос — разрешаем доступ любому провайдеру
      console.log(
        `[GET /requests/${requestId}] Access granted for provider to general request: ${userIdStr}`
      );
    }

    // Если дошли сюда, значит доступ разрешен
    console.log(
      `[GET /requests/${requestId}] Access granted to user: ${userIdStr}`
    );

    // Формируем объект с информацией о запросе, который будет совместим с ChatRequest
    const chatRequestData = {
      _id: request._id,
      userId: request.userId || null,
      providerId: request.providerId || null,
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

// Тестовый маршрут для загрузки изображений
router.post("/test-upload", upload.single("image"), (req, res) => {
  try {
    console.log("Received upload request");

    if (!req.file) {
      console.log("No file received");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File uploaded successfully:", {
      path: req.file.path,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      cloudinaryData: req.file.cloudinaryData,
    });

    res.json({
      success: true,
      file: {
        path: req.file.path,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        cloudinaryData: req.file.cloudinaryData,
      },
    });
  } catch (error) {
    console.error("Error in test-upload route:", error);
    res.status(500).json({
      error: "Failed to upload file",
      details: error.message,
      stack: error.stack,
    });
  }
});

module.exports = router;
