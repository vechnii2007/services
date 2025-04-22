const Offer = require("../models/Offer");
const Promotion = require("../models/Promotion");
const { BadRequestError, NotFoundError } = require("../utils/errors");
const ApiError = require("../utils/ApiError");

// Опции продвижения
const promotionOptions = {
  TOP: {
    name: "TOP",
    description: "Размещение объявления в топе результатов поиска",
    duration: 7, // дней
    price: 999,
  },
  HIGHLIGHT: {
    name: "HIGHLIGHT",
    description: "Выделение объявления в результатах поиска",
    duration: 3, // дней
    price: 499,
  },
  URGENT: {
    name: "URGENT",
    description: 'Пометка "Срочно" на объявлении',
    duration: 5, // дней
    price: 699,
  },
};

// Получить список доступных опций продвижения
exports.getPromotionOptions = async (req, res) => {
  try {
    res.json(promotionOptions);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении опций продвижения" });
  }
};

// Получить статус продвижений для объявления
exports.getPromotionStatus = async (req, res) => {
  try {
    const { offerId } = req.params;

    const activePromotions = await Promotion.find({
      offerId,
      endDate: { $gt: new Date() },
    });

    const status = {
      TOP: false,
      HIGHLIGHT: false,
      URGENT: false,
    };

    activePromotions.forEach((promotion) => {
      status[promotion.type] = true;
    });

    res.json(status);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Ошибка при получении статуса продвижений" });
  }
};

// Создать новое продвижение
exports.createPromotion = async (req, res) => {
  try {
    console.log("=== Create Promotion Request ===");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    console.log("User:", req.user);

    const { offerId } = req.params;
    const { type } = req.body;
    const userId = req.user.id;

    console.log("Looking for offer:", offerId);
    // Проверяем существование объявления
    const offer = await Offer.findById(offerId);
    console.log("Found offer:", offer);

    if (!offer) {
      console.log("Offer not found");
      return res.status(404).json({ message: "Объявление не найдено" });
    }

    // Проверяем, что пользователь является владельцем объявления
    console.log("Checking ownership:", {
      offerProviderId: offer.providerId.toString(),
      userId: userId,
      isOwner: offer.providerId.toString() === userId,
    });

    // ВРЕМЕННО: отключаем проверку владельца для тестирования
    const isTestMode =
      process.env.NODE_ENV === "development" || req.query.test === "true";

    if (!isTestMode && offer.providerId.toString() !== userId) {
      console.log("User is not the owner");
      return res
        .status(403)
        .json({ message: "Нет прав на продвижение этого объявления" });
    }

    if (isTestMode) {
      console.log("TEST MODE: Skipping ownership check");
    }

    // Проверяем, нет ли уже активного продвижения этого типа
    console.log("Checking existing promotions for:", { offerId, type });
    const existingPromotion = await Promotion.findOne({
      offerId,
      type,
      endDate: { $gt: new Date() },
    });
    console.log("Existing promotion:", existingPromotion);

    if (existingPromotion) {
      console.log("Promotion already exists");
      return res.status(400).json({ message: "Это продвижение уже активно" });
    }

    // Создаем новое продвижение
    const option = promotionOptions[type];
    console.log("Selected promotion option:", option);

    if (!option) {
      console.log("Invalid promotion type:", type);
      return res.status(400).json({ message: "Неверный тип продвижения" });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + option.duration);

    console.log("Creating new promotion:", {
      offerId,
      userId,
      type,
      price: option.price,
      startDate,
      endDate,
    });

    // Создаем запись в коллекции Promotion
    const promotion = new Promotion({
      offerId,
      userId,
      type,
      price: option.price,
      startDate,
      endDate,
    });

    await promotion.save();
    console.log("Promotion saved successfully:", promotion);

    // Обновляем поле promotion в объекте Offer
    offer.promotion = {
      type,
      startDate,
      endDate,
      active: true,
      price: option.price,
    };

    await offer.save();
    console.log("Offer updated with promotion");

    res.status(201).json(promotion);
  } catch (error) {
    console.error("Error creating promotion:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Ошибка при создании продвижения" });
  }
};

// Отменить продвижение
exports.cancelPromotion = async (req, res) => {
  try {
    const { offerId, type } = req.params;
    const userId = req.user.id;

    // ВРЕМЕННО: отключаем проверку владельца для тестирования
    const isTestMode =
      process.env.NODE_ENV === "development" || req.query.test === "true";

    const query = {
      offerId,
      type,
      endDate: { $gt: new Date() },
    };

    // Добавляем проверку userId только если не в тестовом режиме
    if (!isTestMode) {
      query.userId = userId;
    }

    const promotion = await Promotion.findOne(query);

    if (!promotion) {
      return res
        .status(404)
        .json({ message: "Активное продвижение не найдено" });
    }

    // Устанавливаем дату окончания на текущий момент для промоакции
    promotion.endDate = new Date();
    await promotion.save();

    // Находим и обновляем объявление
    const offer = await Offer.findById(offerId);
    if (offer && offer.promotion && offer.promotion.type === type) {
      // Деактивируем промоакцию в объявлении
      offer.promotion.active = false;
      offer.promotion.endDate = new Date();
      await offer.save();
      console.log("Offer promotion deactivated");
    }

    res.json({ message: "Продвижение отменено" });
  } catch (error) {
    console.error("Error canceling promotion:", error);
    res.status(500).json({ message: "Ошибка при отмене продвижения" });
  }
};

// Добавить новую промоакцию к объявлению
const addPromotion = async (req, res) => {
  const { offerId } = req.params;
  const { type, price } = req.body;
  const userId = req.user.id;

  try {
    // Проверяем, существует ли объявление
    const offer = await Offer.findById(offerId);
    if (!offer) {
      throw new ApiError(404, "Объявление не найдено");
    }

    // ВРЕМЕННО: отключаем проверку владельца для тестирования
    const isTestMode =
      process.env.NODE_ENV === "development" || req.query.test === "true";

    if (!isTestMode && offer.providerId.toString() !== userId) {
      throw new ApiError(
        403,
        "У вас нет прав на добавление промоакции к этому объявлению"
      );
    }

    if (isTestMode) {
      console.log("TEST MODE: Skipping ownership check");
    }

    // Проверяем, нет ли уже активной промоакции такого типа
    const existingPromotion = await Promotion.findOne({
      offerId,
      type,
      endDate: { $gt: new Date() },
    });

    if (existingPromotion) {
      throw new ApiError(
        400,
        "У этого объявления уже есть активная промоакция данного типа"
      );
    }

    // Создаем новую промоакцию
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // Промоакция на 7 дней

    const promotion = await Promotion.create({
      offerId,
      userId,
      type,
      price,
      startDate,
      endDate,
    });

    res.status(201).json(promotion);
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Error in addPromotion:", error);
    res.status(500).json({ message: "Ошибка при создании промоакции" });
  }
};

// Получить все промоакции для объявления
const getOfferPromotions = async (req, res) => {
  const { offerId } = req.params;

  const promotions = await Promotion.find({ offerId });
  res.json(promotions);
};

// Получить все активные промоакции пользователя
const getUserPromotions = async (req, res) => {
  const userId = req.user.id;

  const promotions = await Promotion.find({
    userId,
    endDate: { $gt: new Date() },
  }).populate("offerId", "title price");

  res.json(promotions);
};

// Удалить промоакцию
const deletePromotion = async (req, res) => {
  const { promotionId } = req.params;
  const userId = req.user.id;

  const promotion = await Promotion.findById(promotionId);
  if (!promotion) {
    throw new ApiError(404, "Промоакция не найдена");
  }

  if (promotion.userId.toString() !== userId) {
    throw new ApiError(403, "У вас нет прав на удаление этой промоакции");
  }

  await promotion.remove();
  res.status(204).send();
};

module.exports = {
  addPromotion,
  getOfferPromotions,
  getUserPromotions,
  deletePromotion,
  getPromotionOptions: exports.getPromotionOptions,
  getPromotionStatus: exports.getPromotionStatus,
  createPromotion: exports.createPromotion,
  cancelPromotion: exports.cancelPromotion,
};
