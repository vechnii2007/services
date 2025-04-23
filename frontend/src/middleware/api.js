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
      cancelTokens.get(requestKey).cancel();
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

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
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

      // Если 401 - очищаем токен
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
