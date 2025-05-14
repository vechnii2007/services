const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("./models/Message");
const ServiceRequest = require("./models/ServiceRequest");
const Offer = require("./models/Offer");
const User = require("./models/User");
const mongoose = require("mongoose");

let io;
let connectedUsers = new Map(); // Храним подключенных пользователей
let userRooms = new Map(); // Храним комнаты пользователей
let chatRooms = new Map(); // Хранилище для соответствия requestId => chatRoomId

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      if (socket.handshake.query && socket.handshake.query.token) {
        const decoded = jwt.verify(
          socket.handshake.query.token,
          process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);
        if (!user) {
          return next(new Error("User not found"));
        }

        socket.user = {
          id: user._id.toString(),
          name: user.name,
          role: user.role,
        };

        next();
      } else {
        next(new Error("Authentication error"));
      }
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;

    // Сохраняем сокет пользователя
    connectedUsers.set(userId, socket.id);

    // Присоединяем к персональной комнате
    socket.join(userId);

    socket.on("joinRoom", async (requestId) => {
      try {
        console.log("Join room request:", {
          userId,
          userName: socket.user.name,
          requestId,
        });

        if (!requestId || typeof requestId !== "string") {
          throw new Error("Invalid requestId format");
        }

        // Проверяем, не пытаемся ли присоединиться к комнате с ID пользователя
        if (requestId.startsWith("user_")) {
          throw new Error("Invalid room format: Cannot use user ID as room ID");
        }

        // Найдем запрос или оффер
        let request = null;
        let offer = null;

        if (mongoose.Types.ObjectId.isValid(requestId)) {
          request = await ServiceRequest.findById(requestId);
          if (!request) {
            offer = await Offer.findById(requestId);
          }
        }

        if (!request && !offer) {
          // Поищем по связанным идентификаторам в сообщениях
          const messages = await Message.find({
            $or: [{ requestId }, { offerId: requestId }],
          }).limit(1);

          if (messages.length > 0) {
            const messageRequestId = messages[0].requestId;
            if (messageRequestId) {
              request = await ServiceRequest.findById(messageRequestId);
            }
          }
        }

        const item = request || offer;
        if (!item) {
          throw new Error("Request/Offer not found");
        }

        // Определяем участников чата
        const userIdStr = item.userId?.toString() || userId;
        const providerIdStr =
          item.providerId?.toString() ||
          (userId === userIdStr ? `temp_${Date.now()}` : userId);

        // Проверяем права доступа
        if (userId !== userIdStr && userId !== providerIdStr) {
          throw new Error("Access denied");
        }

        // Создаем уникальный ID комнаты
        const chatRoomId = [userIdStr, providerIdStr].sort().join("_");
        chatRooms.set(requestId, chatRoomId);

        // Сохраняем информацию о комнате пользователя
        if (!userRooms.has(userId)) {
          userRooms.set(userId, new Set());
        }
        userRooms.get(userId).add(chatRoomId);

        // Присоединяемся к комнате
        socket.join(chatRoomId);
        socket.join(requestId); // Для обратной совместимости

        console.log("User joined chat room:", {
          userId,
          userName: socket.user.name,
          requestId,
          chatRoomId,
        });
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("private_message", async (data) => {
      try {
        const { recipientId, message, requestId } = data;

        console.log("[DIAG][private_message] Входящие данные:", {
          from: userId,
          to: recipientId,
          requestId,
          data,
          userRole: socket.user.role,
          userName: socket.user.name,
        });

        if (!recipientId || !message) {
          console.error("[DIAG][private_message] Нет recipientId или message", {
            recipientId,
            message,
          });
          throw new Error("Missing required message data");
        }

        // Нормализуем ID получателя
        const normalizedRecipientId =
          typeof recipientId === "object"
            ? recipientId._id?.toString()
            : recipientId;

        if (!normalizedRecipientId) {
          console.error("[DIAG][private_message] Некорректный recipientId", {
            recipientId,
          });
          throw new Error("Invalid recipient ID");
        }

        console.log("New private message:", {
          from: userId,
          to: normalizedRecipientId,
          requestId,
          messagePreview: message.substring(0, 30),
        });

        // Определяем chatRoomId
        let chatRoomId = requestId ? chatRooms.get(requestId) : null;
        if (!chatRoomId) {
          chatRoomId = [userId, normalizedRecipientId].sort().join("_");
          if (requestId) {
            chatRooms.set(requestId, chatRoomId);
          }
        }

        // Создаем сообщение
        const messageData = {
          senderId: userId,
          recipientId: normalizedRecipientId,
          message,
          requestId,
          timestamp: new Date(),
        };

        let newMessage;
        try {
          newMessage = await Message.create(messageData);
          await newMessage.populate("senderId", "name avatar role");
          await newMessage.populate("recipientId", "name avatar role");
          console.log("[DIAG][private_message] Сообщение успешно создано:", {
            _id: newMessage._id,
            senderId: newMessage.senderId?._id,
            recipientId: newMessage.recipientId?._id,
            requestId: newMessage.requestId,
            message: newMessage.message,
          });
        } catch (err) {
          console.error(
            "[DIAG][private_message] Ошибка при создании сообщения:",
            err
          );
          throw err;
        }

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
          type: data.type || "text",
          fileName: data.fileName || undefined,
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

        // Отправляем в комнату чата
        io.to(chatRoomId).emit("private_message", dto);

        // Отправляем напрямую получателю для надежности
        const recipientSocketId = connectedUsers.get(normalizedRecipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("private_message", dto);
        }

        // --- PATCH: отправка уведомления через NotificationService ---
        try {
          const NotificationService = require("./services/NotificationService");
          const notifPayload = {
            type: "message",
            message: `Новое сообщение от ${socket.user.name}`,
            relatedId: requestId || null,
            senderId: userId,
            requestId: requestId || null,
          };
          await NotificationService.sendNotification(
            normalizedRecipientId,
            notifPayload
          );
        } catch (notifErr) {
          console.error("[DIAG][socket] NotificationService error:", notifErr);
        }
      } catch (error) {
        console.error(
          "[DIAG][private_message] Error sending private message:",
          error
        );
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("leaveRoom", (roomId) => {
      try {
        if (!roomId || typeof roomId !== "string") {
          throw new Error("Invalid room ID");
        }

        const chatRoomId = chatRooms.get(roomId) || roomId;

        socket.leave(chatRoomId);
        socket.leave(roomId); // Для обратной совместимости

        if (userRooms.has(userId)) {
          userRooms.get(userId).delete(chatRoomId);
          if (userRooms.get(userId).size === 0) {
            userRooms.delete(userId);
          }
        }

        console.log("User left chat room:", {
          userId,
          userName: socket.user.name,
          roomId,
          chatRoomId,
        });
      } catch (error) {
        console.error("Error leaving room:", error);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      if (!socket.user?.id) {
        return;
      }

      // Очищаем комнаты пользователя
      if (userRooms.has(userId)) {
        const rooms = userRooms.get(userId);
        rooms.forEach((room) => socket.leave(room));
        userRooms.delete(userId);
      }

      // Удаляем из списка подключенных
      connectedUsers.delete(userId);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

function emitClearCache() {
  if (io) {
    io.emit("clear_cache");
  }
}

module.exports = {
  initializeSocket,
  getIO,
  emitClearCache,
};
