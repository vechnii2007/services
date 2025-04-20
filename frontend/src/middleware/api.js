import axios from "axios";
import { API_BASE_URL, getFullApiUrl } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Добавляем /api с проверкой на дубликаты
    config.url = getFullApiUrl(config.url);

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
    return Promise.reject(error);
  }
);

export default api;
