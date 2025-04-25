/**
 * Утилиты для работы с датами
 */

/**
 * Форматирует дату в локализованное представление
 * @param {string|Date} date - Дата для форматирования
 * @param {object} options - Опции форматирования
 * @returns {string} Отформатированная дата
 */
export const formatDate = (date, options = {}) => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Проверяем валидность даты
    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date provided to formatDate:", date);
      return "";
    }

    // Настройки форматирования по умолчанию
    const defaultOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    };

    return dateObj.toLocaleString(
      navigator.language || "ru-RU",
      defaultOptions
    );
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

/**
 * Возвращает относительное время (например, "5 минут назад")
 * @param {string|Date} date - Дата для форматирования
 * @returns {string} Относительное время
 */
export const getRelativeTime = (date) => {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Проверяем валидность даты
    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date provided to getRelativeTime:", date);
      return "";
    }

    const now = new Date();
    const diffMs = now - dateObj;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return "только что";
    } else if (diffMin < 60) {
      return `${diffMin} ${getMinutesText(diffMin)} назад`;
    } else if (diffHour < 24) {
      return `${diffHour} ${getHoursText(diffHour)} назад`;
    } else if (diffDay < 7) {
      return `${diffDay} ${getDaysText(diffDay)} назад`;
    } else {
      return formatDate(dateObj);
    }
  } catch (error) {
    console.error("Error calculating relative time:", error);
    return "";
  }
};

// Вспомогательные функции для склонения слов
const getMinutesText = (minutes) => {
  const lastDigit = minutes % 10;
  const lastTwoDigits = minutes % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "минут";
  if (lastDigit === 1) return "минуту";
  if (lastDigit >= 2 && lastDigit <= 4) return "минуты";
  return "минут";
};

const getHoursText = (hours) => {
  const lastDigit = hours % 10;
  const lastTwoDigits = hours % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "часов";
  if (lastDigit === 1) return "час";
  if (lastDigit >= 2 && lastDigit <= 4) return "часа";
  return "часов";
};

const getDaysText = (days) => {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "дней";
  if (lastDigit === 1) return "день";
  if (lastDigit >= 2 && lastDigit <= 4) return "дня";
  return "дней";
};
