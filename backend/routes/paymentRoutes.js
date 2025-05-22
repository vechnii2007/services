const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const isAuth = require("../middleware/auth");
const { isAdmin } = require("../middleware/authMiddleware");

// Маршруты для администраторов
router.get("/stats", isAuth, isAdmin, paymentController.getStats);
router.get("/", isAuth, isAdmin, paymentController.getAll);
router.patch("/:id/status", isAuth, isAdmin, paymentController.updateStatus);

// Маршруты для пользователей
router.post("/", isAuth, paymentController.create);
router.get("/user/:userId", isAuth, paymentController.getUserPayments);
router.get("/:id", isAuth, paymentController.getById);

module.exports = router;
