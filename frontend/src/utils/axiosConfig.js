import axios from "axios";

// Создаём экземпляр axios с базовыми настройками
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001",
  headers: {
    "Content-Type": "application/json",
  },
});

// Добавляем токен к каждому запросу, если он есть
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Логируем запрос для отладки
    console.log("Request:", {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: config.headers,
    });
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
    // Логируем успешный ответ
    console.log("Response:", {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    // Логируем ошибку ответа
    console.error("Response error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default instance;
