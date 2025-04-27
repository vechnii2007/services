/**
 * Конфигурационные константы для приложения
 */

// В разработке используем localhost без слеша в конце
// В продакшене это будет заменено на реальный домен
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001";

// Другие константы приложения
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
