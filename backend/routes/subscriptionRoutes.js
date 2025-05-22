console.log("subscriptionRoutes.js loaded");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const subscriptionController = require("../controllers/subscriptionController");
// Получить текущую подписку пользователя
router.get("/me", auth, (req, res, next) => {
  console.log("[ROUTE] GET /api/subscriptions/me called");
  subscriptionController.getMySubscription(req, res, next);
});

module.exports = router;
