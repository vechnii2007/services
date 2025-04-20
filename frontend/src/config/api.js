const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";
export const API_PREFIX = "/api";

// Убираем /api из базового URL если он там есть
export const API_BASE_URL = API_BASE.endsWith("/api")
  ? API_BASE.slice(0, -4)
  : API_BASE;

export const getFullApiUrl = (path) => {
  // Убираем дублирование /api если оно есть
  const cleanPath = path.startsWith("/api") ? path.substring(4) : path;
  // Убираем лишний слеш в начале пути если он есть
  const normalizedPath = cleanPath.startsWith("/")
    ? cleanPath
    : `/${cleanPath}`;
  return `${API_PREFIX}${normalizedPath}`;
};
