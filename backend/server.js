const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { initializeSocket } = require("./socket");
const NotificationService = require("./services/NotificationService");
const { UPLOADS_DIR, UPLOADS_PATH } = require("./config/uploadConfig");

const app = express();
const server = http.createServer(app);

// Инициализация WebSocket
initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(UPLOADS_PATH, express.static(path.join(__dirname, UPLOADS_DIR)));

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost/service-portal", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
