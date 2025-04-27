const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ServiceRequest = require("../models/ServiceRequest");
const ServiceOffer = require("../models/ServiceOffer");
const Offer = require("../models/Offer");
const Category = require("../models/Category");
const auth = require("../middleware/auth");
const { isAdmin } = require("../middleware/authMiddleware");
const { upload, UPLOADS_PATH } = require("../config/uploadConfig");
const path = require("path");
const categoryController = require("../controllers/categoryController");

// Получение списка пользователей с фильтрацией и пагинацией
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;
    const query = {};
    if (search)
      query.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    if (role) query.role = role;

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await User.countDocuments(query);
    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Создание пользователя
router.post("/users", auth, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }
    const user = new User({ name, email, password, role, phone, address });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Полное редактирование пользователя
router.patch("/users/:id", auth, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password; // Хеширование будет в pre-save
    if (role) user.role = role;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Изменение статуса пользователя (блокировка/разблокировка)
router.patch("/users/:id/status", auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.status = user.status === "active" ? "blocked" : "active";
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Изменение роли пользователя
router.patch("/users/:id/role", auth, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "provider", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.role = role;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Удаление пользователя
router.delete("/users/:id", auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Получение списка запросов с фильтрацией и пагинацией
router.get("/requests", auth, isAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    const requests = await ServiceRequest.find(query)
      .populate("userId", "name email")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await ServiceRequest.countDocuments(query);
    res.json({
      requests,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Создание запроса
router.post("/requests", auth, isAdmin, async (req, res) => {
  try {
    const { userId, serviceType, location, coordinates, description } =
      req.body;
    if (!userId || !serviceType || !location || !description) {
      return res
        .status(400)
        .json({ error: "All fields except coordinates are required" });
    }
    const request = new ServiceRequest({
      userId,
      serviceType,
      location,
      coordinates,
      description,
    });
    await request.save();
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Полное редактирование запроса
router.patch("/requests/:id", auth, isAdmin, async (req, res) => {
  try {
    const { userId, serviceType, location, coordinates, description } =
      req.body;
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    if (userId) request.userId = userId;
    if (serviceType) request.serviceType = serviceType;
    if (location) request.location = location;
    if (coordinates) request.coordinates = coordinates;
    if (description) request.description = description;
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Изменение статуса запроса
router.patch("/requests/:id/status", auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "accepted", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    request.status = status;
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Удаление запроса
router.delete("/requests/:id", auth, isAdmin, async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.json({ message: "Request deleted" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Тестовый маршрут без авторизации (только для отладки)
router.get("/test-offers", async (req, res) => {
  try {
    console.log("Starting /admin/test-offers request processing");

    const { status, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Построение запроса
    const query = {};
    if (status) query.status = status;

    console.log(
      "DEBUG: Filter query:",
      JSON.stringify(query),
      "Skip:",
      skip,
      "Limit:",
      limitNumber
    );

    // Получаем данные только из коллекции Offer
    console.log("Fetching data from Offer collection only");
    const [offers, offersCount] = await Promise.all([
      Offer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      Offer.countDocuments(query),
    ]);

    console.log(`DEBUG: Offers count: ${offersCount}`);
    console.log(`DEBUG: Number of offers returned: ${offers.length}`);

    // Подготавливаем ответ
    const total = offersCount;
    const pages = Math.ceil(total / limitNumber);

    console.log(
      `Response prepared: total=${total}, pages=${pages}, page=${pageNumber}`
    );

    res.json({
      offers: offers.map((offer) => ({ ...offer._doc, type: "Offer" })),
      total,
      page: pageNumber,
      pages,
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение списка предложений с фильтрацией и пагинацией
router.get("/offers", auth, isAdmin, async (req, res) => {
  try {
    console.log("Starting /admin/offers request processing");

    // Добавляем заголовки для предотвращения кеширования
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

    const { status, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Построение запроса
    const query = {};
    if (status) query.status = status;

    console.log(
      "DEBUG: Filter query:",
      JSON.stringify(query),
      "Skip:",
      skip,
      "Limit:",
      limitNumber
    );

    // Получаем данные только из коллекции Offer
    console.log("Fetching data from Offer collection only");
    const [offers, offersCount] = await Promise.all([
      Offer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .populate("providerId", "name email"),
      Offer.countDocuments(query),
    ]);

    console.log(`DEBUG: Offers count: ${offersCount}`);
    console.log(`DEBUG: Number of offers returned: ${offers.length}`);

    // Подготавливаем ответ
    const total = offersCount;
    const pages = Math.ceil(total / limitNumber);

    console.log(
      `Response prepared: total=${total}, pages=${pages}, page=${pageNumber}`
    );

    res.json({
      offers: offers.map((offer) => ({ ...offer._doc, type: "Offer" })),
      total,
      page: pageNumber,
      pages,
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение конкретного предложения по ID
router.get("/offers/:id", auth, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;

    // Проверяем, является ли ID запросом (ServiceRequest)
    let item = await ServiceRequest.findById(id).populate(
      "userId",
      "name email"
    );
    if (item) {
      // Убедимся, что поле images существует
      if (!item._doc.images) {
        item._doc.images = [];
      }
      return res.json({ ...item._doc, type: "ServiceRequest" });
    }

    // Проверяем, является ли ID услугой (ServiceOffer)
    item = await ServiceOffer.findById(id).populate("providerId", "name email");
    if (item) {
      // Убедимся, что поле images существует
      if (!item._doc.images) {
        item._doc.images = [];
      }
      return res.json({ ...item._doc, type: "ServiceOffer" });
    }

    // Проверяем, является ли ID предложением (Offer)
    item = await Offer.findById(id).populate("providerId", "name email");
    if (item) {
      // Убедимся, что поле images существует
      if (!item._doc.images) {
        item._doc.images = [];
      }
      return res.json({ ...item._doc, type: "Offer" });
    }

    // Если ничего не найдено, возвращаем 404
    return res.status(404).json({ error: "Item not found" });
  } catch (error) {
    console.error("Error fetching offer:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Создание предложения
router.post(
  "/offers",
  auth,
  isAdmin,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { title, providerId, serviceType, location, description, price } =
        req.body;

      // Проверяем наличие обязательных полей, включая title
      if (
        !title ||
        !providerId ||
        !serviceType ||
        !location ||
        !description ||
        !price
      ) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const images = req.files.map((file) => `/images/${file.filename}`);
      const offer = new Offer({
        title,
        providerId,
        serviceType,
        location,
        description,
        price,
        images,
      });
      await offer.save();
      res.status(201).json(offer);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Полное редактирование предложения
router.patch(
  "/offers/:id",
  auth,
  isAdmin,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { title, providerId, serviceType, location, description, price } =
        req.body;
      const existingImages = req.body.existingImages || []; // Существующие изображения (пути)

      // Преобразуем existingImages в массив, если это строка или одиночный элемент
      const existingImagesArray = Array.isArray(existingImages)
        ? existingImages
        : [existingImages].filter(Boolean);

      const offer = await Offer.findById(req.params.id);
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      // Обновляем поля
      if (title) offer.title = title;
      if (providerId) offer.providerId = providerId;
      if (serviceType) offer.serviceType = serviceType;
      if (location) offer.location = location;
      if (description) offer.description = description;
      if (price) offer.price = price;

      // Обновляем изображения: комбинируем существующие и новые
      const newImages =
        req.files && req.files.length > 0
          ? req.files.map((file) => `/images/${file.filename}`)
          : [];
      offer.images = [...existingImagesArray, ...newImages];

      await offer.save();
      res.json(offer);
    } catch (error) {
      console.error("Error updating offer:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Изменение статуса предложения
router.patch("/offers/:id/status", auth, isAdmin, async (req, res) => {
  try {
    const { status, type } = req.body;
    let item;
    if (type === "ServiceRequest") {
      if (!["pending", "accepted", "completed"].includes(status)) {
        return res
          .status(400)
          .json({ error: "Invalid status for ServiceRequest" });
      }
      item = await ServiceRequest.findById(req.params.id);
    } else if (type === "ServiceOffer") {
      if (!["pending", "active", "inactive"].includes(status)) {
        return res
          .status(400)
          .json({ error: "Invalid status for ServiceOffer" });
      }
      item = await ServiceOffer.findById(req.params.id);
    } else if (type === "Offer") {
      if (!["pending", "accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status for Offer" });
      }
      item = await Offer.findById(req.params.id);
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    item.status = status;
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Удаление предложения
router.delete("/offers/:id", auth, isAdmin, async (req, res) => {
  try {
    const { type } = req.body;
    let item;
    if (type === "ServiceRequest") {
      item = await ServiceRequest.findByIdAndDelete(req.params.id);
    } else if (type === "ServiceOffer") {
      item = await ServiceOffer.findByIdAndDelete(req.params.id);
    } else if (type === "Offer") {
      item = await Offer.findByIdAndDelete(req.params.id);
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Получение списка категорий
router.get("/categories", auth, isAdmin, categoryController.getAllCategories);

// Создание новой категории
router.post(
  "/categories",
  auth,
  isAdmin,
  upload.single("image"),
  categoryController.createCategory
);

// Обновление категории
router.put(
  "/categories/:id",
  auth,
  isAdmin,
  upload.single("image"),
  categoryController.updateCategory
);

// Удаление категории
router.delete(
  "/categories/:id",
  auth,
  isAdmin,
  categoryController.deleteCategory
);

module.exports = router;
