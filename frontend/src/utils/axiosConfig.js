import axios from "axios";
import { API_BASE_URL } from "../config";

// Создаём экземпляр axios с базовыми настройками
const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Хранилище для токенов отмены запросов
const cancelTokens = new Map();

// Добавляем токен к каждому запросу, если он есть
instance.interceptors.request.use(
  (config) => {
    // Отменяем предыдущий запрос с таким же URL
    const requestKey = `${config.method}-${config.url}`;
    if (cancelTokens.has(requestKey)) {
      cancelTokens.get(requestKey).cancel("Отмена дублирующегося запроса");
    }

    // Создаём новый токен отмены
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    cancelTokens.set(requestKey, source);

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Добавляем /api к URL, если его нет и URL не начинается с /api
    if (!config.url.startsWith("/api/") && !config.url.startsWith("/api")) {
      config.url = `/api${config.url}`;
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Обработка ошибок ответа
instance.interceptors.response.use(
  (response) => {
    // Удаляем токен отмены после успешного запроса
    const requestKey = `${response.config.method}-${response.config.url}`;
    cancelTokens.delete(requestKey);

    return response;
  },
  (error) => {
    if (!axios.isCancel(error)) {
      // Удаляем токен отмены при ошибке (кроме случая отмены запроса)
      if (error.config) {
        const requestKey = `${error.config.method}-${error.config.url}`;
        cancelTokens.delete(requestKey);
      }

      // Логируем только критические ошибки
      console.error("Response error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    return Promise.reject(error);
  }
);

export default instance;
