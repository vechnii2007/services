/**
 * Обертка для асинхронных обработчиков, которая перехватывает ошибки и передает их в middleware обработки ошибок
 * @param {Function} fn - Асинхронная функция-обработчик запроса
 * @returns {Function} Обработчик с перехватом ошибок
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
