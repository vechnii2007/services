require("dotenv").config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost/service-portal",
  port: process.env.PORT || 5001,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Настройки для WebSocket
  socket: {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  },

  // Настройки для уведомлений
  notifications: {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
    vapidSubject: process.env.VAPID_SUBJECT || "mailto:your-email@example.com",
  },
};
