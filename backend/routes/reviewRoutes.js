const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/ReviewController");
const authenticateJWT = require("../middleware/auth");

// Маршруты для работы с отзывами
// Все маршруты требуют аутентификации

// Получение отзывов по ID предложения - доступно всем
router.get("/offer/:offerId", reviewController.getReviewsByOffer);

// Получение отзывов по ID поставщика - доступно всем
router.get("/provider/:providerId", reviewController.getReviewsByProvider);

// Получение отзыва по ID - доступно всем
router.get("/:reviewId", reviewController.getReviewById);

// Создание нового отзыва - требуется аутентификация
router.post("/", authenticateJWT, reviewController.createReview);

// Обновление отзыва - требуется аутентификация
router.put("/:reviewId", authenticateJWT, reviewController.updateReview);

// Удаление отзыва - требуется аутентификация
router.delete("/:reviewId", authenticateJWT, reviewController.deleteReview);

module.exports = router;
