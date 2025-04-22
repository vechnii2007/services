const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ratingController = require("../controllers/ratingController");

// Получить все рейтинги для предложения
router.get("/:offerId/ratings", ratingController.getRatings);

// Получить рейтинг текущего пользователя для предложения
router.get("/:offerId/ratings/me", auth, ratingController.getUserRating);

// Добавить или обновить рейтинг
router.post("/:offerId/ratings", auth, ratingController.addRating);

// Удалить рейтинг
router.delete("/:offerId/ratings", auth, ratingController.deleteRating);

module.exports = router;
