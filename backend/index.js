const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const http = require("http");
const { initializeSocket } = require("./socket");
const NotificationService = require("./services/NotificationService");
const categoryStatsService = require("./services/CategoryStatsService");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const searchRoutes = require("./routes/search");
const { UPLOADS_DIR, UPLOADS_PATH } = require("./config/uploadConfig");
require("dotenv").config();

// Логирование для проверки JWT_SECRET
console.log("JWT_SECRET:", process.env.JWT_SECRET);

if (!process.env.JWT_SECRET) {
  console.error("Error: JWT_SECRET is not defined in .env file");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Инициализация WebSocket
initializeSocket(server);

// Настройка Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());

// Настройка статических путей с использованием абсолютного пути
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

// Routes
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);

// Добавляем обратную совместимость для старых маршрутов
app.use("/services", serviceRoutes);

// Инициализация push-уведомлений
NotificationService.setup()
  .then((publicKey) => {
    app.get("/api/notifications/vapid-public-key", (req, res) => {
      res.json({ publicKey });
    });
  })
  .catch((error) => {
    console.error("Error setting up push notifications:", error);
  });

// Инициализируем cron-задачу для обновления статистики
categoryStatsService.initCronJob();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Проверка подключения к MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    // Логируем текущую базу данных
    console.log("Database name:", mongoose.connection.db.databaseName);

    // Выполняем первичную синхронизацию статистики
    categoryStatsService.fullSync();

    // Start server
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});
