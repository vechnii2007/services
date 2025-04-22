const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Message = require("../models/Message");
const User = require("../models/User");

// Получить все чаты пользователя
router.get("/", auth, async (req, res) => {
  try {
    // Находим уникальные чаты, где пользователь участвует
    const chats = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: mongoose.Types.ObjectId(req.user.id) },
            { recipient: mongoose.Types.ObjectId(req.user.id) },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", mongoose.Types.ObjectId(req.user.id)] },
              "$recipient",
              "$sender",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: 1,
            name: 1,
            avatar: 1,
          },
          lastMessage: {
            _id: 1,
            text: 1,
            createdAt: 1,
            read: 1,
          },
        },
      },
    ]);

    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Ошибка при получении списка чатов" });
  }
});

// Получить сообщения для конкретного чата
router.get("/:userId", auth, async (req, res) => {
  try {
    const chatUserId = req.params.userId;
    const currentUserId = req.user.id;

    // Проверяем, существует ли пользователь
    const chatUser = await User.findById(chatUserId);
    if (!chatUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Получаем сообщения между двумя пользователями
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: chatUserId },
        { sender: chatUserId, recipient: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    // Помечаем непрочитанные сообщения как прочитанные
    await Message.updateMany(
      {
        sender: chatUserId,
        recipient: currentUserId,
        read: false,
      },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ message: "Ошибка при получении сообщений чата" });
  }
});

// Отправить сообщение
router.post("/:userId", auth, async (req, res) => {
  try {
    const { text } = req.body;
    const recipientId = req.params.userId;
    const senderId = req.user.id;

    // Проверяем, существует ли получатель
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Получатель не найден" });
    }

    // Создаем новое сообщение
    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      text,
      read: false,
    });

    await newMessage.save();

    // В реальном приложении здесь отправили бы уведомление через WebSocket

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Ошибка при отправке сообщения" });
  }
});

module.exports = router;
