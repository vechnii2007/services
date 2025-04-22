const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const {
  addPromotion,
  getOfferPromotions,
  getUserPromotions,
  deletePromotion,
  getPromotionOptions,
  getPromotionStatus,
  createPromotion,
  cancelPromotion,
} = require("../controllers/promotionController");

// Логирование маршрутов
router.use((req, res, next) => {
  console.log("=== Promotion Route ===");
  console.log("Full URL:", req.originalUrl);
  console.log("Base URL:", req.baseUrl);
  console.log("Path:", req.path);
  console.log("Params:", req.params);
  console.log("====================");
  next();
});

// Получить список доступных опций продвижения
router.get("/options", asyncHandler(getPromotionOptions));

// Получить статус продвижений для объявления
router.get("/status", asyncHandler(getPromotionStatus));

// Создать новое продвижение
router.post("/", auth, asyncHandler(createPromotion));

// Отменить продвижение
router.delete("/:type", auth, asyncHandler(cancelPromotion));

// Получить все промоакции для объявления
router.get("/", asyncHandler(getOfferPromotions));

// Получить все активные промоакции пользователя
router.get("/my", auth, asyncHandler(getUserPromotions));

// Удалить промоакцию
router.delete("/:promotionId", auth, asyncHandler(deletePromotion));

module.exports = router;
