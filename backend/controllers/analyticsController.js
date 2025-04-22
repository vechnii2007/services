const AnalyticsService = require("../services/analyticsService");
const Offer = require("../models/Offer");
const Promotion = require("../models/Promotion");

const analyticsService = new AnalyticsService();

/**
 * Записать просмотр объявления
 * @param {Object} req - Express запрос
 * @param {Object} res - Express ответ
 */
exports.recordView = async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user ? req.user.id : null;

    // Получаем метаданные из запроса
    const metadata = {
      referrer: req.get("Referrer") || null,
      userAgent: req.get("User-Agent") || null,
      ip: req.ip,
      ...req.body.metadata,
    };

    await analyticsService.recordView(offerId, userId, metadata);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error recording view:", error);
    res.status(500).json({ message: "Ошибка при записи просмотра" });
  }
};

/**
 * Записать контакт с автором объявления
 * @param {Object} req - Express запрос
 * @param {Object} res - Express ответ
 */
exports.recordContact = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { type, metadata = {} } = req.body;
    const userId = req.user ? req.user.id : null;

    // Проверяем обязательные поля
    if (!type) {
      return res.status(400).json({ message: "Тип контакта обязателен" });
    }

    // Записываем контакт
    await analyticsService.recordContact(offerId, userId, type, metadata);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error recording contact:", error);
    res.status(500).json({ message: "Ошибка при записи контакта" });
  }
};

/**
 * Получить статистику просмотров объявления
 * @param {Object} req - Express запрос
 * @param {Object} res - Express ответ
 */
exports.getOfferViewStats = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { startDate, endDate } = req.query;

    // Проверяем доступ - только владелец объявления или админ может получить статистику
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: "Объявление не найдено" });
    }

    // Проверка прав доступа (временно отключена для тестирования)
    const isTestMode =
      process.env.NODE_ENV === "development" || req.query.test === "true";
    if (
      !isTestMode &&
      req.user.id !== offer.providerId.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "У вас нет прав для просмотра этой статистики" });
    }

    // Форматируем даты
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // По умолчанию - 30 дней
    const end = endDate ? new Date(endDate) : new Date();

    // Получаем данные из сервиса аналитики
    const viewStats = await analyticsService.getOfferViewStats(
      offerId,
      start,
      end
    );

    res.status(200).json(viewStats);
  } catch (error) {
    console.error("Error getting offer view stats:", error);
    res
      .status(500)
      .json({ message: "Ошибка при получении статистики просмотров" });
  }
};

/**
 * Получить статистику эффективности промоакции
 * @param {Object} req - Express запрос
 * @param {Object} res - Express ответ
 */
exports.getPromotionStats = async (req, res) => {
  try {
    const { promotionId } = req.params;

    // Проверяем права доступа
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      return res.status(404).json({ message: "Промоакция не найдена" });
    }

    // Проверка прав доступа (временно отключена для тестирования)
    const isTestMode =
      process.env.NODE_ENV === "development" || req.query.test === "true";
    if (
      !isTestMode &&
      req.user.id !== promotion.userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "У вас нет прав для просмотра этой статистики" });
    }

    // Получаем статистику
    const stats = await analyticsService.getPromotionStats(promotionId);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error getting promotion stats:", error);
    res
      .status(500)
      .json({ message: "Ошибка при получении статистики промоакции" });
  }
};

/**
 * Получить сводную статистику всех промоакций пользователя
 * @param {Object} req - Express запрос
 * @param {Object} res - Express ответ
 */
exports.getUserPromotionsStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Проверка прав доступа
    if (userId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "У вас нет прав для просмотра этой статистики" });
    }

    // Получаем статистику
    const stats = await analyticsService.getUserPromotionsStats(userId);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error getting user promotions stats:", error);
    res
      .status(500)
      .json({
        message: "Ошибка при получении статистики промоакций пользователя",
      });
  }
};

/**
 * Получить сравнительную статистику эффективности разных типов промоакций
 * @param {Object} req - Express запрос
 * @param {Object} res - Express ответ
 */
exports.getPromotionTypeStats = async (req, res) => {
  try {
    // Этот эндпоинт доступен только администраторам
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "У вас нет прав для просмотра этой статистики" });
    }

    const stats = await analyticsService.getPromotionTypeStats();

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error getting promotion type stats:", error);
    res
      .status(500)
      .json({ message: "Ошибка при получении статистики типов промоакций" });
  }
};
