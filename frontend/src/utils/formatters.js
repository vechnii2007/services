export const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Форматирует цену, добавляя символ евро и разделители тысяч
 * @param {number} price - Цена для форматирования
 * @returns {string} Отформатированная цена
 */
export const formatPrice = (price) => {
  // Проверяем валидность цены
  if (price === null || price === undefined || isNaN(price)) {
    return "€0";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatPhone = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`;
  }
  return phone;
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Форматирование пути к изображению
export const formatImagePath = (imagePath) => {
  if (!imagePath) return null;

  // Базовый URL бэкенда
  const API_BASE = "http://localhost:5001";

  // Если путь уже содержит полный URL, возвращаем его
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Если путь начинается с "/", убираем его для совместимости
  const normalizedPath = imagePath.startsWith("/")
    ? imagePath.substring(1)
    : imagePath;

  // Проверяем, содержит ли путь 'uploads/images'
  if (normalizedPath.includes("uploads/images/")) {
    return `${API_BASE}/${normalizedPath}`;
  }

  // Если путь содержит только 'images'
  if (normalizedPath.includes("images/")) {
    return `${API_BASE}/uploads/${normalizedPath}`;
  }

  // Просто имя файла без пути - предполагаем, что оно находится в uploads/images
  if (!normalizedPath.includes("/")) {
    return `${API_BASE}/uploads/images/${normalizedPath}`;
  }

  // В остальных случаях добавляем базовый URL и uploads/images
  return `${API_BASE}/uploads/images/${normalizedPath}`;
};

/**
 * Форматирует массив путей к изображениям
 * @param {Array|string} images - массив путей к изображениям или одиночное изображение
 * @returns {Array} - массив отформатированных путей к изображениям
 */
export const formatImagePaths = (images) => {
  // Если передана строка, преобразуем ее в массив
  if (typeof images === "string") {
    return [formatImagePath(images)].filter(Boolean);
  }

  // Если передан массив, форматируем каждый путь
  if (Array.isArray(images)) {
    return images.map(formatImagePath).filter(Boolean);
  }

  return [];
};
