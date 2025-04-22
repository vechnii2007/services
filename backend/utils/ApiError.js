/**
 * Класс для API ошибок
 */
class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Создает ошибку "Не найдено" (404)
   * @param {string} message - Сообщение об ошибке
   * @returns {ApiError} Объект ошибки
   */
  static notFound(message = "Ресурс не найден") {
    return new ApiError(message, 404);
  }

  /**
   * Создает ошибку "Доступ запрещен" (403)
   * @param {string} message - Сообщение об ошибке
   * @returns {ApiError} Объект ошибки
   */
  static forbidden(message = "Доступ запрещен") {
    return new ApiError(message, 403);
  }

  /**
   * Создает ошибку "Неавторизован" (401)
   * @param {string} message - Сообщение об ошибке
   * @returns {ApiError} Объект ошибки
   */
  static unauthorized(message = "Требуется авторизация") {
    return new ApiError(message, 401);
  }

  /**
   * Создает ошибку "Неверный запрос" (400)
   * @param {string} message - Сообщение об ошибке
   * @returns {ApiError} Объект ошибки
   */
  static badRequest(message = "Неверный запрос") {
    return new ApiError(message, 400);
  }

  /**
   * Создает ошибку "Конфликт" (409)
   * @param {string} message - Сообщение об ошибке
   * @returns {ApiError} Объект ошибки
   */
  static conflict(message = "Конфликт с текущим состоянием ресурса") {
    return new ApiError(message, 409);
  }

  /**
   * Создает ошибку "Внутренняя ошибка сервера" (500)
   * @param {string} message - Сообщение об ошибке
   * @returns {ApiError} Объект ошибки
   */
  static internal(message = "Внутренняя ошибка сервера") {
    return new ApiError(message, 500);
  }
}

module.exports = ApiError;
