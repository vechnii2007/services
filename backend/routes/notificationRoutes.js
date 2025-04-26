const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const NotificationService = require("../services/NotificationService");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Получение уведомлений пользователя
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение количества непрочитанных уведомлений
router.get("/unread/count", auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false,
    });

    res.json({ count });
  } catch (error) {
    console.error("Error counting unread notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Отметка уведомления как прочитанного
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Отметка всех уведомлений как прочитанных
router.put("/read/all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Подписка на push-уведомления
router.post("/subscribe", auth, async (req, res) => {
  try {
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription data" });
    }

    // Сохраняем подписку в профиле пользователя
    await User.findByIdAndUpdate(req.user.id, {
      pushSubscription: subscription,
    });

    res.json({ message: "Successfully subscribed to push notifications" });
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Отписка от push-уведомлений
router.post("/unsubscribe", auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { pushSubscription: 1 },
    });

    res.json({ message: "Successfully unsubscribed from push notifications" });
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение VAPID публичного ключа
router.get("/vapid-public-key", async (req, res) => {
  try {
    const publicKey = await NotificationService.setup();
    res.json({ publicKey });
  } catch (error) {
    console.error("Error getting VAPID public key:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
