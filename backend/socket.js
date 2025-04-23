const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
      jwt.verify(
        socket.handshake.query.token,
        process.env.JWT_SECRET,
        (err, decoded) => {
          if (err) return next(new Error("Authentication error"));
          socket.decoded = decoded;
          next();
        }
      );
    } else {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.decoded.id);

    // Присоединяем пользователя к его персональной комнате
    socket.join(socket.decoded.id);

    // Обновляем статус пользователя на "онлайн"
    socket.broadcast.emit("user_status", {
      userId: socket.decoded.id,
      status: "online",
    });

    // Обработка личных сообщений
    socket.on("private_message", async (data) => {
      const { recipientId, message } = data;

      // Отправляем сообщение получателю
      io.to(recipientId).emit("private_message", {
        senderId: socket.decoded.id,
        message,
        timestamp: new Date(),
      });
    });

    // Обработка уведомлений о печатании
    socket.on("typing", (data) => {
      const { recipientId } = data;
      io.to(recipientId).emit("typing", {
        userId: socket.decoded.id,
      });
    });

    // Обработка отключения пользователя
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.decoded.id);
      socket.broadcast.emit("user_status", {
        userId: socket.decoded.id,
        status: "offline",
      });
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

module.exports = {
  initializeSocket,
  getIO,
};
