const { ApiError } = require("../utils/errors");

const errorHandler = (err, req, res, next) => {
  console.error("Error:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
    status: err.status,
    statusCode: err.statusCode,
  });

  // Если это наша кастомная ошибка API
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Ошибки MongoDB - некорректный ID
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({
      status: "fail",
      message: "Invalid ID format",
    });
  }

  // Ошибки валидации MongoDB
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({
      status: "fail",
      message: "Validation Error",
      errors,
    });
  }

  // Дубликат уникального поля
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      status: "fail",
      message: `Duplicate value for ${field}. This ${field} is already in use.`,
    });
  }

  // Все остальные ошибки
  return res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};

module.exports = errorHandler;
