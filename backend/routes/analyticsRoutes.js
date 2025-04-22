const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const auth = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminOnly");

// Публичные маршруты
// Запись просмотра объявления (может быть анонимным)
router.post("/offers/:offerId/views", analyticsController.recordView);

// Запись контакта с автором (может быть анонимным, но лучше авторизованным)
router.post("/offers/:offerId/contacts", analyticsController.recordContact);

// Защищенные маршруты (требуют авторизации)
// Получение статистики просмотров объявления
router.get(
  "/offers/:offerId/stats/views",
  auth,
  analyticsController.getOfferViewStats
);

// Получение статистики промоакции
router.get(
  "/promotions/:promotionId/stats",
  auth,
  analyticsController.getPromotionStats
);

// Получение статистики всех промоакций пользователя
router.get(
  "/users/me/promotions/stats",
  auth,
  analyticsController.getUserPromotionsStats
);
router.get(
  "/users/:userId/promotions/stats",
  auth,
  analyticsController.getUserPromotionsStats
);

// Маршруты для администраторов
// Получение сравнительной статистики по типам промоакций
router.get(
  "/promotions/stats/by-type",
  auth,
  adminOnly,
  analyticsController.getPromotionTypeStats
);

module.exports = router;
