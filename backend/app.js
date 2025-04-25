const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Error handling
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Log all registered routes
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    // Routes registered directly on the app
    console.log(
      `${Object.keys(middleware.route.methods)} ${middleware.route.path}`
    );
  } else if (middleware.name === "router") {
    // Router middleware
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        const path = handler.route.path;
        const methods = Object.keys(handler.route.methods);
        console.log(`${methods} ${middleware.regexp} ${path}`);
      }
    });
  }
});

module.exports = app;
