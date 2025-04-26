const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const auth = require("../middleware/auth");
const { getIO } = require("../socket");
const NotificationService = require("../services/NotificationService");
const ServiceRequest = require("../models/ServiceRequest");
const mongoose = require("mongoose");
const User = require("../models/User");

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
      .limit(50)
      .populate("senderId", "name avatar")
      .populate("recipientId", "name avatar");

    res.json(messages.reverse());
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение истории сообщений по запросу/предложению
router.get("/request/:requestId", auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    // Находим запрос/предложение для проверки прав доступа
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Проверяем права доступа
    if (
      request.userId.toString() !== req.user.id &&
      request.providerId.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const messages = await Message.find({ requestId })
      .sort({ timestamp: 1 })
      .populate("senderId", "name avatar")
      .populate("recipientId", "name avatar");

    res.json(messages);
  } catch (error) {
    console.error("Error fetching request messages:", error);
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

// Отправка сообщения
router.post("/", auth, async (req, res) => {
  try {
    const { recipientId, message, requestId } = req.body;

    if (!recipientId || !message) {
      return res
        .status(400)
        .json({ error: "Recipient and message are required" });
    }

    // Нормализуем ID получателя
    const normalizedRecipientId =
      typeof recipientId === "object"
        ? recipientId._id?.toString()
        : recipientId;

    if (
      !normalizedRecipientId ||
      !mongoose.Types.ObjectId.isValid(normalizedRecipientId)
    ) {
      return res.status(400).json({ error: "Invalid recipient ID" });
    }

    // Проверяем существование получателя
    const recipient = await User.findById(normalizedRecipientId);
    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found" });
    }

    // Создаем сообщение
    const messageData = {
      senderId: req.user.id,
      recipientId: normalizedRecipientId,
      message,
      timestamp: new Date(),
    };

    // Если есть requestId, проверяем его и добавляем
    if (requestId) {
      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }
      messageData.requestId = requestId;
    }

    const newMessage = await Message.create(messageData);
    await newMessage.populate("senderId", "name avatar");
    await newMessage.populate("recipientId", "name avatar");

    // Отправляем через WebSocket
    const io = getIO();
    io.to(normalizedRecipientId).emit("private_message", newMessage);

    // Отправляем уведомление
    await NotificationService.sendNotification(normalizedRecipientId, {
      type: "message",
      message: `Новое сообщение от ${req.user.name}`,
      relatedId: newMessage._id,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Получение сообщений для конкретного запроса
router.get("/:requestId", auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    console.log(
      `[GET /messages/${requestId}] Запрос сообщений от пользователя: ${userId}`
    );

    // Проверка доступа к сообщениям
    const chatRequest = await ServiceRequest.findById(requestId);
    if (!chatRequest) {
      console.log(`[GET /messages/${requestId}] Запрос не найден`);
      return res.status(404).json({ message: "Запрос не найден" });
    }

    // Проверяем, что пользователь имеет право читать сообщения (является отправителем или получателем)
    if (
      chatRequest.userId.toString() !== userId &&
      chatRequest.providerId.toString() !== userId
    ) {
      console.log(
        `[GET /messages/${requestId}] Отказано в доступе. Запрос принадлежит user: ${chatRequest.userId}, provider: ${chatRequest.providerId}`
      );
      return res.status(403).json({ message: "Доступ запрещен" });
    }

    const messages = await Message.find({ requestId }).sort({ createdAt: 1 });

    console.log(
      `[GET /messages/${requestId}] Найдено сообщений: ${messages.length}`
    );

    res.json(messages);
  } catch (error) {
    console.error("Ошибка при получении сообщений:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Получение сообщений по requestId
router.get("/request/:requestId", auth, async (req, res) => {
  const startTime = Date.now();
  console.log("=== GET MESSAGES BY REQUEST ID ===");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`User: ${req.user.id} (${req.user.name}, ${req.user.role})`);
  console.log(`RequestId: ${req.params.requestId}`);

  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      console.error("Invalid requestId format:", requestId);
      return res.status(400).json({ error: "Invalid requestId format" });
    }

    console.log("Searching for request:", requestId);
    const request = await ServiceRequest.findById(requestId)
      .populate("userId", "name _id")
      .populate("providerId", "name _id")
      .lean();

    if (!request) {
      console.error("Request not found:", requestId);
      return res.status(404).json({ error: "Request not found" });
    }

    console.log("Found request:", {
      id: request._id,
      userId: request.userId._id,
      providerId: request.providerId._id,
      status: request.status,
    });

    // Проверяем права доступа
    const userId = req.user.id;
    const userIdStr = userId.toString();
    const requestUserIdStr = request.userId._id.toString();
    const requestProviderIdStr = request.providerId._id.toString();

    console.log("Checking access rights:", {
      userId: userIdStr,
      requestUserId: requestUserIdStr,
      requestProviderId: requestProviderIdStr,
    });

    if (userIdStr !== requestUserIdStr && userIdStr !== requestProviderIdStr) {
      console.error("Access denied for user:", userIdStr);
      return res.status(403).json({ error: "Access denied" });
    }

    console.log("Access granted. Fetching messages...");
    const messages = await Message.find({ requestId })
      .sort({ createdAt: 1 })
      .lean();

    console.log(`Found ${messages.length} messages for request ${requestId}`);

    // Добавляем имена отправителей
    const messagesWithNames = await Promise.all(
      messages.map(async (message) => {
        const sender = await User.findById(message.senderId)
          .select("name")
          .lean();
        return {
          ...message,
          senderName: sender ? sender.name : "Unknown",
        };
      })
    );

    console.log(`Added sender names to ${messagesWithNames.length} messages`);

    const endTime = Date.now();
    console.log(`Request completed in ${endTime - startTime}ms`);
    console.log("=== END GET MESSAGES BY REQUEST ID ===");

    res.json(messagesWithNames);
  } catch (error) {
    console.error("Error fetching messages:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;
