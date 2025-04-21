import axios from "axios";
import { API_BASE_URL, API_PREFIX } from "../config";

// Хранилище для токенов отмены запросов
const cancelTokens = new Map();

const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Отменяем предыдущий запрос с таким же URL
    const requestKey = `${config.method}-${config.url}`;
    if (cancelTokens.has(requestKey)) {
      cancelTokens.get(requestKey).cancel("Отмена дублирующегося запроса");
      console.log("Cancelling duplicate request:", requestKey);
    }

    // Создаём новый токен отмены
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    cancelTokens.set(requestKey, source);

    // Добавляем токен авторизации
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Логируем запрос в development
    if (process.env.NODE_ENV === "development") {
      console.log("API Request:", {
        url: config.url,
        method: config.method,
        data: config.data,
        headers: config.headers,
        baseURL: config.baseURL,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Удаляем токен отмены после успешного запроса
    const requestKey = `${response.config.method}-${response.config.url}`;
    cancelTokens.delete(requestKey);

    // Логируем ответ в development
    if (process.env.NODE_ENV === "development") {
      console.log("API Response:", {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  (error) => {
    if (!axios.isCancel(error)) {
      // Удаляем токен отмены при ошибке (кроме случая отмены запроса)
      if (error.config) {
        const requestKey = `${error.config.method}-${error.config.url}`;
        cancelTokens.delete(requestKey);
      }

      // Обработка ошибок
      if (error.response) {
        // Если 401 - очищаем токен
        if (error.response.status === 401) {
          localStorage.removeItem("token");
        }

        // Логируем ошибку в development
        if (process.env.NODE_ENV === "development") {
          console.error("API Error:", {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            baseURL: error.config?.baseURL,
          });
        }
      }
    } else {
      // Логируем отмену запроса в development
      if (process.env.NODE_ENV === "development") {
        console.log("API Request Cancelled:", error.message);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
