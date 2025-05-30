console.log("subscriptionRoutes.js loaded");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const subscriptionController = require("../controllers/subscriptionController");
const promotionService = require("../services/promotionService");
// Получить текущую подписку пользователя
router.get("/me", auth, (req, res, next) => {
  console.log("[ROUTE] GET /api/subscriptions/me called");
  subscriptionController.getMySubscription(req, res, next);
});

// Получить все подписки пользователя
router.get("/my-all", auth, (req, res, next) => {
  subscriptionController.getAllMySubscriptions(req, res, next);
});

// Получить лимиты пользователя на основе подписки
router.get("/limits/me", auth, async (req, res) => {
  try {
    const roleLimit = await promotionService.getUserRoleLimit(req.user.id);
    res.json({
      limits: roleLimit?.limits || {},
      type: roleLimit?.type || "free",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
