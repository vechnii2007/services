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
// Хранилище для соответствия requestId => chatRoomId
let chatRooms = new Map();

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
    console.log("User connected:", {
      userId,
      userName: socket.user.name,
      socketId: socket.id,
    });

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

        // Валидируем и проверяем формат ID
        if (!requestId || typeof requestId !== "string") {
          throw new Error("Invalid requestId format");
        }

        // Проверяем, не пытаемся ли присоединиться к комнате с ID пользователя
        if (requestId.startsWith("user_")) {
          console.error(
            "Error: Trying to join room with user ID instead of request ID"
          );
          socket.emit("error", {
            message: "Invalid room format: Cannot use user ID as room ID",
          });
          return;
        }

        // Найдем запрос или оффер
        let request = null;
        let offer = null;

        try {
          if (isValidObjectId(requestId)) {
            request = await safeQueryById(
              ServiceRequest,
              requestId,
              "Service request not found"
            );

            if (!request) {
              offer = await safeQueryById(Offer, requestId, "Offer not found");
            }
          } else {
            console.log(
              "Invalid ObjectId format, will try to find related request"
            );
          }
        } catch (err) {
          console.error("Error looking up request/offer:", err);
        }

        if (!request && !offer) {
          console.log(
            "Request/Offer not found, will try to find by related ID"
          );

          // Если запрос не найден, поищем по связанным идентификаторам в сообщениях
          const messages = await Message.find({
            $or: [{ requestId }, { offerId: requestId }],
          }).limit(1);

          if (messages.length > 0) {
            // Используем requestId из сообщения
            const messageRequestId = messages[0].requestId;
            if (messageRequestId) {
              request = await ServiceRequest.findById(messageRequestId);
            }
          }

          if (!request && !offer) {
            // Если всё еще не нашли, поищем запрос, связанный с этим пользователем
            const userRequests = await ServiceRequest.find({
              $or: [{ userId }, { providerId: userId }],
            })
              .sort({ createdAt: -1 })
              .limit(10);

            if (userRequests.length > 0) {
              request = userRequests[0]; // Берем самый свежий запрос
              console.log("Found related request:", request._id);
            }
          }
        }

        // Если не нашли ни запрос, ни оффер - ошибка
        if (!request && !offer) {
          throw new Error("Request/Offer not found");
        }

        const item = request || offer;

        // Добавим дополнительное логирование
        console.log("Found item for joining room:", {
          type: request ? "ServiceRequest" : "Offer",
          id: item._id?.toString(),
          hasUserId: !!item.userId,
          hasProviderId: !!item.providerId,
          userId: item.userId?.toString(),
          providerId: item.providerId?.toString(),
        });

        // Проверяем и создаем userIdStr и providerIdStr
        let userIdStr = "";
        let providerIdStr = "";

        // Если есть оба ID, используем их
        if (item.userId && item.providerId) {
          userIdStr = item.userId.toString();
          providerIdStr = item.providerId.toString();
        }
        // Если есть только providerId, используем текущего пользователя как userId
        else if (item.providerId && !item.userId) {
          providerIdStr = item.providerId.toString();
          userIdStr = userId; // Текущий пользователь будет считаться клиентом
          console.log(
            "Using current user as userId since it's missing in the item"
          );
        }
        // Если есть только userId, используем текущего пользователя как providerId
        else if (item.userId && !item.providerId) {
          userIdStr = item.userId.toString();
          providerIdStr = userId; // Текущий пользователь будет считаться провайдером
          console.log(
            "Using current user as providerId since it's missing in the item"
          );
        }
        // Если нет ни одного ID, используем текущего пользователя как один ID и создаем второй уникальный ID
        else {
          userIdStr = userId;
          // Создаем временный ID для второго участника (чтобы комната не была пустой)
          providerIdStr = `temp_${new Date().getTime()}`;
          console.log("Created temporary room with user as sole participant");
        }

        // Проверяем, что оба ID не пустые после всех наших действий
        if (!userIdStr || !providerIdStr) {
          console.error("Failed to determine chat participants:", {
            userIdStr,
            providerIdStr,
            itemId: item._id,
          });
          throw new Error("Failed to determine chat participants");
        }

        // Проверяем права доступа - пользователь должен быть одним из участников чата
        if (userId !== userIdStr && userId !== providerIdStr) {
          console.error("Access denied for user:", {
            userId,
            userIdStr,
            providerIdStr,
          });
          throw new Error("Access denied");
        }

        // Определяем уникальный ID для комнаты чата (соединение userId и providerId)
        const chatRoomId = [userIdStr, providerIdStr].sort().join("_");

        // Сохраняем соответствие между requestId и chatRoomId
        chatRooms.set(requestId, chatRoomId);

        // Проверяем наличие _id и добавляем обратное соответствие
        if (item && item._id) {
          const itemIdStr = item._id.toString();

          // Также сохраняем обратное соответствие, если это новый ID запроса
          if (itemIdStr !== requestId) {
            chatRooms.set(itemIdStr, chatRoomId);
          }

          console.log("Chat room mapping:", {
            originalRequestId: requestId,
            actualRequestId: itemIdStr,
            chatRoomId,
          });
        } else {
          console.log("Chat room mapping (no item ID):", {
            originalRequestId: requestId,
            chatRoomId,
          });
        }

        // Сохраняем информацию о комнате пользователя
        if (!userRooms.has(userId)) {
          userRooms.set(userId, new Set());
        }
        userRooms.get(userId).add(chatRoomId);

        // Присоединяем к комнате чата (используем chatRoomId вместо requestId)
        socket.join(chatRoomId);

        console.log("User joined chat room:", {
          userId,
          userName: socket.user.name,
          originalRequestId: requestId,
          chatRoomId,
          rooms: Array.from(socket.rooms),
        });

        // Также подписываемся на комнату с оригинальным ID для обратной совместимости
        socket.join(requestId);
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("private_message", async (data) => {
      try {
        const { recipientId, message, requestId } = data;

        if (!recipientId || !message || !requestId) {
          console.error("Missing required fields in private_message:", data);
          socket.emit("error", { message: "Missing required message data" });
          return;
        }

        // Проверяем, что recipientId - строка. Если объект, то пытаемся получить ID
        let normalizedRecipientId = recipientId;
        if (typeof recipientId === "object") {
          if (recipientId && recipientId._id) {
            normalizedRecipientId = recipientId._id.toString();
          } else {
            console.error("Invalid recipientId format:", recipientId);
            socket.emit("error", { message: "Invalid recipientId format" });
            return;
          }
        }

        // Дополнительная проверка recipientId
        if (!normalizedRecipientId) {
          console.error("Recipient ID is empty or invalid:", recipientId);
          socket.emit("error", { message: "Invalid or empty recipient ID" });
          return;
        }

        console.log("New message received on socket:", {
          from: userId,
          fromName: socket.user.name,
          to: normalizedRecipientId,
          requestId,
          message,
          socketId: socket.id,
        });

        // Определяем chatRoomId для requestId
        let chatRoomId = chatRooms.get(requestId);

        if (!chatRoomId) {
          // Если chatRoomId не найден, создаем новый из userId и recipientId
          chatRoomId = [userId, normalizedRecipientId].sort().join("_");
          chatRooms.set(requestId, chatRoomId);

          console.log("Created new chat room mapping:", {
            requestId,
            chatRoomId,
          });
        }

        try {
          // Создаем сообщение в базе
          const newMessage = await Message.create({
            senderId: userId,
            recipientId: normalizedRecipientId,
            requestId,
            message,
            timestamp: new Date(),
          });

          // Проверяем наличие созданного сообщения и его ID
          if (!newMessage || !newMessage._id) {
            console.error(
              "Failed to create message or missing ID:",
              newMessage
            );
            socket.emit("error", { message: "Failed to create message" });
            return;
          }

          // Формируем сообщение для отправки
          const messageToSend = {
            _id: newMessage._id.toString(),
            message: newMessage.message,
            senderId: userId,
            recipientId: normalizedRecipientId,
            requestId: requestId,
            timestamp: newMessage.timestamp,
            userId: {
              _id: userId,
              name: socket.user.name,
            },
          };

          console.log("Sending message to rooms:", {
            originalRequestId: requestId,
            chatRoomId,
            messageId: messageToSend._id,
          });

          // Отправляем сообщение в обе комнаты - и по chatRoomId, и по requestId
          io.to(chatRoomId).emit("private_message", messageToSend);
          io.to(requestId).emit("private_message", messageToSend);

          // Также отправляем сообщение напрямую получателю для надежности
          const recipientSocketId = connectedUsers.get(normalizedRecipientId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit("private_message", messageToSend);
          }
        } catch (dbError) {
          console.error("Database error while saving message:", dbError);
          socket.emit("error", {
            message: "Failed to save message to database",
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("leaveRoom", (roomId) => {
      try {
        console.log("Leave room request:", {
          userId,
          userName: socket.user.name,
          roomId,
        });

        if (!roomId || typeof roomId !== "string") {
          console.error("Invalid roomId format:", roomId);
          socket.emit("error", { message: "Invalid roomId format" });
          return;
        }

        // Проверяем, есть ли комната в соответствиях
        let chatRoomId = chatRooms.get(roomId);
        if (!chatRoomId) {
          chatRoomId = roomId; // Если не найдено, используем исходный roomId
        }

        // Покидаем комнату
        socket.leave(chatRoomId);
        console.log("User left chat room:", {
          userId,
          userName: socket.user.name,
          originalRoomId: roomId,
          chatRoomId,
        });

        // Также покидаем комнату с оригинальным ID для обратной совместимости
        if (roomId !== chatRoomId) {
          socket.leave(roomId);
        }

        // Обновляем информацию о комнатах пользователя
        if (userRooms.has(userId)) {
          userRooms.get(userId).delete(chatRoomId);
          if (userRooms.get(userId).size === 0) {
            userRooms.delete(userId);
          }
        }
      } catch (error) {
        console.error("Error leaving room:", error);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      // Проверяем наличие информации о пользователе
      if (!socket.user || !socket.user.id) {
        console.log("Socket disconnected (unknown user):", {
          socketId: socket.id,
        });
        return;
      }

      console.log("User disconnected:", {
        userId,
        userName: socket.user.name || "Unknown",
        socketId: socket.id,
      });

      // Очищаем все комнаты пользователя
      if (userRooms.has(userId)) {
        try {
          const rooms = userRooms.get(userId);
          if (rooms && typeof rooms.forEach === "function") {
            rooms.forEach((room) => {
              socket.leave(room);
            });
          }
          userRooms.delete(userId);
        } catch (error) {
          console.error("Error cleaning up user rooms:", error);
        }
      }

      // Удаляем пользователя из списка подключенных
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

// Добавляем служебную функцию для проверки ID
const isValidObjectId = (id) => {
  if (!id) {
    console.warn("Empty ID provided to isValidObjectId");
    return false;
  }

  if (typeof id !== "string" && typeof id !== "object") {
    console.warn(`Invalid ID type: ${typeof id}`);
    return false;
  }

  try {
    // Преобразуем в строку, если это объект с методом toString
    const idStr =
      typeof id === "object" && id.toString ? id.toString() : String(id);
    return mongoose.Types.ObjectId.isValid(idStr);
  } catch (error) {
    console.error("Error validating ObjectId:", error);
    return false;
  }
};

// Обертка для безопасного поиска по ID
const safeQueryById = async (model, id, errorMessage = "Entity not found") => {
  try {
    if (!isValidObjectId(id)) {
      console.warn(`Invalid ObjectId format: ${id}`);
      return null;
    }

    const result = await model.findById(id);
    if (!result) {
      console.warn(`${errorMessage}: ${id}`);
    }
    return result;
  } catch (error) {
    console.error(`Error querying by ID (${id}):`, error);
    return null;
  }
};

module.exports = {
  initializeSocket,
  getIO,
};
