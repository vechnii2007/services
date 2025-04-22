const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
const multer = require("multer");
const webpush = require("web-push");
const { initializeSocket } = require("./socket");
// Используем отдельные функции, а не класс
const notificationService = require("./services/NotificationService");
const { UPLOADS_DIR, UPLOADS_PATH } = require("./config/uploadConfig");
const offerRoutes = require("./routes/offerRoutes");
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const adminRoutes = require("./routes/adminRoutes");
// Временно закомментировано, так как файлы отсутствуют
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const chatRoutes = require("./routes/chatRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

require("dotenv").config();

// Проверка наличия JWT_SECRET
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Defined" : "Not defined");
if (!process.env.JWT_SECRET) {
  console.error("Error: JWT_SECRET is not defined in .env file");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Инициализация WebSocket
initializeSocket(server);

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Настройка CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
  console.log("\n=== Incoming Request ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("======================\n");
  next();
});

// Настройка статических путей
app.use(
  "/images",
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
  express.static(UPLOADS_DIR)
);

app.use(
  UPLOADS_PATH,
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
  express.static(UPLOADS_DIR)
);

// Маршруты API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/offers", ratingRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/offers/:offerId/promotions", promotionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/analytics", analyticsRoutes);

// Инициализация push-уведомлений
// Генерируем VAPID ключи для веб-пуш уведомлений
const vapidKeys = webpush.generateVAPIDKeys();

webpush.setVapidDetails(
  process.env.WEB_PUSH_CONTACT || "mailto:example@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

app.get("/api/notifications/vapid-public-key", (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Подключение к MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost/service-portal", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    console.log("Database name:", mongoose.connection.db.databaseName);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Мониторинг соединения с MongoDB
mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established");
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);

    // Логируем доступные маршруты
    console.log("\nAvailable routes:");
    console.log("- /api/auth");
    console.log("- /api/users");
    console.log("- /api/services");
    console.log("- /api/messages");
    console.log("- /api/notifications");
    console.log("- /api/offers");
    console.log("- /api/promotions");
    console.log("- /api/admin");
    console.log("- /api/categories");
    console.log("- /api/favorites");
    console.log("- /api/chats");
    console.log("- /api/analytics");
  });
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

module.exports = server; // Экспортируем для тестов
