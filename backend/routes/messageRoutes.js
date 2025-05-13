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

    // --- PATCH: безопасная проверка providerId ---
    const userIdStr = request.userId ? request.userId.toString() : null;
    const providerIdStr = request.providerId
      ? request.providerId.toString()
      : null;
    // --- PATCH: разрешаем доступ автору и любому провайдеру, если providerId отсутствует ---
    if (!providerIdStr) {
      // Общий запрос
      const currentUser = await User.findById(req.user.id);
      if (userIdStr !== req.user.id && currentUser?.role !== "provider") {
        return res
          .status(403)
          .json({ error: "Access denied (general request)" });
      }
    } else {
      if (userIdStr !== req.user.id && providerIdStr !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
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
    await newMessage.populate("senderId", "name avatar role");
    await newMessage.populate("recipientId", "name avatar role");

    // Формируем DTO
    const dto = {
      _id: newMessage._id,
      message: newMessage.message,
      text: newMessage.message,
      senderId: newMessage.senderId?._id?.toString() || newMessage.senderId,
      recipientId:
        newMessage.recipientId?._id?.toString() || newMessage.recipientId,
      requestId: newMessage.requestId,
      createdAt: newMessage.timestamp || newMessage.createdAt,
      type: req.body.type || "text",
      fileName: req.body.fileName || undefined,
      sender: newMessage.senderId
        ? {
            _id: newMessage.senderId._id?.toString() || newMessage.senderId,
            name: newMessage.senderId.name,
            avatar: newMessage.senderId.avatar,
            role: newMessage.senderId.role,
          }
        : undefined,
      userId: newMessage.senderId
        ? {
            _id: newMessage.senderId._id?.toString() || newMessage.senderId,
            name: newMessage.senderId.name,
            role: newMessage.senderId.role,
          }
        : undefined,
    };

    // Отправляем через WebSocket
    const io = getIO();
    io.to(normalizedRecipientId).emit("private_message", dto);

    // Отправляем уведомление
    const notifPayload = {
      type: "message",
      message: `Новое сообщение от ${req.user.name}`,
      relatedId: messageData.requestId || null,
      senderId: req.user.id,
      requestId: messageData.requestId || null,
    };
    await NotificationService.sendNotification(
      normalizedRecipientId,
      notifPayload
    );

    res.status(201).json(dto);
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

    // Проверка доступа к сообщениям
    const chatRequest = await ServiceRequest.findById(requestId);
    if (!chatRequest) {
      return res.status(404).json({ message: "Запрос не найден" });
    }

    // Проверяем, что пользователь имеет право читать сообщения (является отправителем или получателем)
    if (
      chatRequest.userId.toString() !== userId &&
      chatRequest.providerId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Доступ запрещен" });
    }

    const messages = await Message.find({ requestId }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Ошибка при получении сообщений:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Получение сообщений по requestId
router.get("/request/:requestId", auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid requestId format" });
    }

    const request = await ServiceRequest.findById(requestId)
      .populate("userId", "name _id")
      .populate("providerId", "name _id")
      .lean();

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Проверяем права доступа
    const userId = req.user.id;
    const userIdStr = userId.toString();
    const requestUserIdStr = request.userId._id.toString();
    const requestProviderIdStr = request.providerId._id.toString();

    if (userIdStr !== requestUserIdStr && userIdStr !== requestProviderIdStr) {
      return res.status(403).json({ error: "Access denied" });
    }

    const messages = await Message.find({ requestId })
      .sort({ createdAt: 1 })
      .lean();

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

    res.json(messagesWithNames);
  } catch (error) {
    console.error("Error fetching messages:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;
