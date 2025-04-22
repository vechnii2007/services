/**
 * Класс для HTTP ошибок с дополнительной информацией
 */
class HttpError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Ошибка "Не найдено" (404)
 */
class NotFoundError extends HttpError {
  constructor(message = "Ресурс не найден") {
    super(message, 404);
  }
}

/**
 * Ошибка "Доступ запрещен" (403)
 */
class ForbiddenError extends HttpError {
  constructor(message = "Доступ запрещен") {
    super(message, 403);
  }
}

/**
 * Ошибка "Неавторизован" (401)
 */
class UnauthorizedError extends HttpError {
  constructor(message = "Требуется авторизация") {
    super(message, 401);
  }
}

/**
 * Ошибка "Неверный запрос" (400)
 */
class BadRequestError extends HttpError {
  constructor(message = "Неверный запрос") {
    super(message, 400);
  }
}

/**
 * Ошибка "Конфликт" (409)
 */
class ConflictError extends HttpError {
  constructor(message = "Конфликт с текущим состоянием ресурса") {
    super(message, 409);
  }
}

/**
 * Ошибка "Внутренняя ошибка сервера" (500)
 */
class InternalServerError extends HttpError {
  constructor(message = "Внутренняя ошибка сервера") {
    super(message, 500);
  }
}

module.exports = {
  HttpError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  BadRequestError,
  ConflictError,
  InternalServerError,
};
