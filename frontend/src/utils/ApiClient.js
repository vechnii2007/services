import axios from "axios";
import TokenManager from "./TokenManager";
import { API_BASE_URL, API_PREFIX } from "../config";

class ApiClient {
  constructor(baseURL) {
    console.log("ApiClient initialized with baseURL:", baseURL);
    this.client = axios.create({
      baseURL: baseURL + API_PREFIX,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log("Making request to:", config.baseURL + config.url);
        const token = TokenManager.getAccessToken();
        if (token) {
          config.headers.Authorization = TokenManager.getAuthHeader(token);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Если ошибка не 401 или запрос уже повторялся - возвращаем ошибку
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          // Повторяем оригинальный запрос
          return this.client(originalRequest);
        } catch (refreshError) {
          // Если не удалось - очищаем токены и перенаправляем на логин
          TokenManager.clearTokens();
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      }
    );
  }

  async get(url, config = {}) {
    return this.client.get(url, config);
  }

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config);
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config);
  }

  async patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config);
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }
}

// Создаем и экспортируем экземпляр с базовым URL
const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
