const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const auth = require("../middleware/auth");
const { getIO } = require("../socket");
const NotificationService = require("../services/NotificationService");

// Получение истории сообщений с конкретным пользователем
router.get("/:userId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, recipientId: req.params.userId },
        { senderId: req.params.userId, recipientId: req.user.id },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(messages.reverse());
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Отметка сообщений как прочитанных
router.put("/:userId/read", auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        senderId: req.params.userId,
        recipientId: req.user.id,
        read: false,
      },
      { read: true }
    );

    const io = getIO();
    io.to(req.params.userId).emit("messages_read", {
      userId: req.user.id,
    });

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение количества непрочитанных сообщений
router.get("/unread/count", auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipientId: req.user.id,
      read: false,
    });

    res.json({ count });
  } catch (error) {
    console.error("Error counting unread messages:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Сохранение сообщения (используется как резервный вариант, если WebSocket недоступен)
router.post("/", auth, async (req, res) => {
  try {
    const { recipientId, message } = req.body;

    const newMessage = await Message.create({
      senderId: req.user.id,
      recipientId,
      message,
    });

    // Отправка уведомления получателю
    await NotificationService.sendNotification(recipientId, {
      type: "message",
      message: `New message from ${req.user.name}`,
      relatedId: newMessage._id,
    });

    const io = getIO();
    io.to(recipientId).emit("private_message", {
      ...newMessage.toObject(),
      senderName: req.user.name,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
