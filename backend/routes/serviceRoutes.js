const express = require("express");
const router = express.Router();
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

// Базовый URL бэкенда
const BASE_URL = "http://localhost:5001";

// Получение всех категорий (доступно всем)
router.get("/categories", async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(
    `[${requestId}][serviceRoutes] GET /categories request started:`,
    {
      headers: {
        "user-agent": req.headers["user-agent"],
        accept: req.headers["accept"],
        referer: req.headers["referer"],
      },
    }
  );

  try {
    const startTime = Date.now();
    const categories = await Category.find();
    const queryTime = Date.now() - startTime;

    console.log(
      `[${requestId}][serviceRoutes] Categories fetched in ${queryTime}ms:`,
      {
        totalCategories: categories.length,
        categoriesList: categories.map((cat) => ({
          id: cat._id,
          name: cat.name,
          label: cat.label,
          hasImage: !!cat.image,
        })),
      }
    );

    res.json(categories);
  } catch (error) {
    console.error(`[${requestId}][serviceRoutes] Error fetching categories:`, {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: "Server error" });
  }
});

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
  async (req, res) => {
    try {
      const { name, label } = req.body;
      if (!name || !label || !req.file) {
        return res
          .status(400)
          .json({ error: "Name, label, and image are required" });
      }

      const category = new Category({
        name,
        label,
        image: `${UPLOADS_PATH}/${req.file.filename}`,
      });
      await category.save();
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Обновление категории (доступно только admin)
router.put(
  "/categories/:id",
  auth,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const { name, label } = req.body;
      category.name = name || category.name;
      category.label = label || category.label;
      if (req.file) {
        category.image = `${UPLOADS_PATH}/${req.file.filename}`;
      }

      await category.save();
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Получение всех предложений с пагинацией и фильтрацией (доступно всем, включая гостей)
router.get("/offers", async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}][serviceRoutes] GET /offers request started:`, {
    query: req.query,
    headers: {
      "user-agent": req.headers["user-agent"],
      accept: req.headers["accept"],
      referer: req.headers["referer"],
    },
  });

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const minPrice = req.query.minPrice
      ? parseFloat(req.query.minPrice)
      : undefined;
    const maxPrice = req.query.maxPrice
      ? parseFloat(req.query.maxPrice)
      : undefined;
    const location = req.query.location;
    const category = req.query.category;

    console.log(`[${requestId}][serviceRoutes] Parsed query parameters:`, {
      page,
      limit,
      minPrice,
      maxPrice,
      location,
      category,
    });

    const skip = (page - 1) * limit;
    const query = {};

    // Строим запрос
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = minPrice;
        console.log(
          `[${requestId}][serviceRoutes] Adding min price filter:`,
          minPrice
        );
      }
      if (maxPrice !== undefined) {
        query.price.$lte = maxPrice;
        console.log(
          `[${requestId}][serviceRoutes] Adding max price filter:`,
          maxPrice
        );
      }
    }

    if (location) {
      query.location = location;
      console.log(
        `[${requestId}][serviceRoutes] Adding location filter:`,
        location
      );
    }

    if (category) {
      query.serviceType = category;
      console.log(
        `[${requestId}][serviceRoutes] Adding category filter:`,
        category
      );
    }

    console.log(
      `[${requestId}][serviceRoutes] Final MongoDB query:`,
      JSON.stringify(query, null, 2)
    );

    const startTime = Date.now();
    const [offers, total] = await Promise.all([
      Offer.find(query)
        .skip(skip)
        .limit(limit)
        .populate("providerId", "name email")
        .lean(),
      Offer.countDocuments(query),
    ]);
    const queryTime = Date.now() - startTime;

    console.log(
      `[${requestId}][serviceRoutes] Query executed in ${queryTime}ms:`,
      {
        offersFound: offers.length,
        totalOffers: total,
        appliedFilters: Object.keys(query),
        page,
        totalPages: Math.ceil(total / limit),
      }
    );

    // Логируем детали каждого найденного предложения
    offers.forEach((offer, index) => {
      console.log(
        `[${requestId}][serviceRoutes] Offer ${index + 1}/${offers.length}:`,
        {
          id: offer._id,
          category: offer.category,
          location: offer.location,
          price: offer.price,
          provider: offer.providerId?.name || "Unknown",
        }
      );
    });

    const response = {
      offers,
      total,
      page,
      pages: Math.ceil(total / limit),
    };

    console.log(`[${requestId}][serviceRoutes] Sending response:`, {
      totalOffers: response.total,
      currentPage: response.page,
      totalPages: response.pages,
      offersInResponse: response.offers.length,
    });

    res.json(response);
  } catch (error) {
    console.error(`[${requestId}][serviceRoutes] Error processing request:`, {
      error: error.message,
      stack: error.stack,
      query: req.query,
    });
    res
      .status(500)
      .json({ message: "Error fetching offers", error: error.message });
  }
});

// Получение конкретного предложения по ID (доступно всем, включая гостей)
router.get("/offers/:id", async (req, res) => {
  try {
    const service = await ServiceOffer.findById(req.params.id);
    if (service) {
      return res.json({ ...service._doc, type: "ServiceOffer" });
    }
    const offer = await Offer.findById(req.params.id).populate(
      "providerId",
      "name email"
    );
    if (offer) {
      return res.json({ ...offer._doc, type: "Offer" });
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

    const offers = await Offer.find({ providerId: req.user.id }).populate(
      "providerId",
      "name email phone address status"
    );
    const formattedOffers = offers.map((offer) => ({
      ...offer._doc,
      images: offer.images.map((image) =>
        image
          ? `${BASE_URL}${image}`
          : "https://via.placeholder.com/150?text=Offer"
      ),
    }));
    res.json(formattedOffers);
  } catch (error) {
    console.error("Error fetching my offers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Создание нового предложения
router.post("/offers", auth, upload.single("image"), async (req, res) => {
  console.log("[serviceRoutes] POST /offers request received");
  try {
    const { title, description, price, location, category } = req.body;
    console.log("[serviceRoutes] Received offer data:", {
      title,
      description,
      price,
      location,
      category,
    });

    if (!title || !description || !price || !location || !category) {
      console.log("[serviceRoutes] Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    const offerData = {
      title,
      description,
      price: parseFloat(price),
      location,
      category,
      provider: req.user._id,
    };

    if (req.file) {
      console.log("[serviceRoutes] Image file received:", req.file.filename);
      offerData.image = path.join(UPLOADS_PATH, req.file.filename);
    }

    console.log("[serviceRoutes] Creating new offer with data:", offerData);
    const offer = new Offer(offerData);
    await offer.save();
    console.log(
      "[serviceRoutes] Offer created successfully with ID:",
      offer._id
    );

    res.status(201).json(offer);
  } catch (error) {
    console.error("[serviceRoutes] Error creating offer:", error);
    res
      .status(500)
      .json({ message: "Error creating offer", error: error.message });
  }
});

// Обновление предложения
router.put(
  "/offers/:id",
  auth,
  isProvider,
  upload.single("image"),
  async (req, res) => {
    try {
      const offer = await Offer.findById(req.params.id);
      if (!offer) {
        return res.status(404).json({ message: "Предложение не найдено" });
      }

      if (req.file) {
        offer.image = `${UPLOADS_PATH}/${req.file.filename}`;
      }
      await offer.save();
      res.json(offer);
    } catch (error) {
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
        image: req.file ? `/uploads/${req.file.filename}` : null,
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
  try {
    const messages = await Message.find({
      requestId: req.params.requestId,
    }).populate("userId", "name status");
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Отправка сообщения в чате запроса
router.post("/messages/:requestId", auth, async (req, res) => {
  try {
    const { message, recipientId } = req.body;

    if (!message || !recipientId) {
      return res
        .status(400)
        .json({ error: "Message and recipientId are required" });
    }

    // Проверяем существование запроса
    const request = await ServiceRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Создаем новое сообщение с полем requestId
    const newMessage = await Message.create({
      senderId: req.user.id,
      recipientId,
      requestId: req.params.requestId,
      message,
    });

    console.log("Created new message:", {
      id: newMessage._id,
      senderId: newMessage.senderId,
      recipientId: newMessage.recipientId,
      requestId: newMessage.requestId,
      message: newMessage.message,
    });

    // Отправляем через WebSocket
    const io = require("../socket").getIO();
    io.to(recipientId).emit("private_message", {
      ...newMessage.toObject(),
      senderName: req.user.name,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Server error" });
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
router.get("/categories/counts", async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(
    `[${requestId}][serviceRoutes] GET /categories/counts request started`
  );

  try {
    // Получаем все категории
    const categories = await Category.find();

    // Получаем количество предложений для каждой категории
    const counts = {};
    await Promise.all(
      categories.map(async (category) => {
        const count = await Offer.countDocuments({ category: category.name });
        counts[category.name] = count;
      })
    );

    console.log(
      `[${requestId}][serviceRoutes] Category counts calculated:`,
      counts
    );

    res.json(counts);
  } catch (error) {
    console.error(
      `[${requestId}][serviceRoutes] Error calculating category counts:`,
      {
        error: error.message,
        stack: error.stack,
      }
    );
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
