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
const auth = require("../middleware/auth");
const path = require("path");

// Базовый URL бэкенда
const BASE_URL = "http://localhost:5001";

// Получение всех категорий (доступно всем)
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
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
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
    const location = req.query.location
      ? req.query.location.toLowerCase()
      : null;

    const serviceFilter = { status: "active" };
    const offerFilter = { status: "active" };

    if (minPrice || maxPrice !== Infinity) {
      serviceFilter.price = { $gte: minPrice, $lte: maxPrice };
      offerFilter.price = { $gte: minPrice, $lte: maxPrice };
    }

    if (location) {
      serviceFilter.location = { $regex: location, $options: "i" };
      offerFilter.location = { $regex: location, $options: "i" };
    }

    const totalServices = await ServiceOffer.countDocuments(serviceFilter);
    const totalOffers = await Offer.countDocuments(offerFilter);
    const total = totalServices + totalOffers;

    const services = await ServiceOffer.find(serviceFilter)
      .skip(skip)
      .limit(limit);
    const offers = await Offer.find(offerFilter).skip(skip).limit(limit);

    const combinedOffers = [
      ...services.map((service) => ({ ...service._doc, type: "ServiceOffer" })),
      ...offers.map((offer) => ({ ...offer._doc, type: "Offer" })),
    ];

    res.json({
      offers: combinedOffers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ error: "Server error" });
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
router.post(
  "/offers",
  auth,
  isProvider,
  upload.single("image"),
  async (req, res) => {
    try {
      const imagePath = req.file
        ? `${UPLOADS_PATH}/${req.file.filename}`
        : null;
      const offer = new Offer({
        ...req.body,
        image: imagePath,
        provider: req.user._id,
      });
      await offer.save();
      res.status(201).json(offer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

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

// Получение всех запросов
router.get("/requests", auth, async (req, res) => {
  try {
    if (req.user.role !== "provider") {
      return res.status(403).json({ error: "Access denied. Providers only." });
    }
    const requests = await ServiceRequest.find().populate(
      "userId",
      "name email phone address status"
    );
    res.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
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

module.exports = router;
