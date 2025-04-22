import { useState, useEffect, useCallback } from "react";
import UserService from "../services/UserService";
import TokenManager from "../utils/TokenManager";
import { TOKEN_CONFIG } from "../config";

// Создаем объект для хранения кэшированных данных
const cache = {
  user: null,
  timestamp: null,
  loading: false,
  subscribers: new Set(),
};

// Время жизни кэша в миллисекундах (5 минут)
const CACHE_TTL = 5 * 60 * 1000;

const notifySubscribers = () => {
  cache.subscribers.forEach((callback) => callback(cache.user));
};

export const useUser = () => {
  const [user, setUser] = useState(cache.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async (force = false) => {
    // Если данные уже загружаются, ждем
    if (cache.loading) {
      return;
    }

    // Проверяем актуальность кэша если это не принудительное обновление
    if (!force) {
      const now = Date.now();
      if (cache.user && cache.timestamp && now - cache.timestamp < CACHE_TTL) {
        setUser(cache.user);
        return;
      }
    }

    const token = TokenManager.getAccessToken();
    if (!token) {
      cache.user = null;
      cache.timestamp = null;
      setUser(null);
      return;
    }

    try {
      setLoading(true);
      cache.loading = true;
      const userData = await UserService.getCurrentUser();
      cache.user = userData;
      cache.timestamp = Date.now();
      setUser(userData);
      notifySubscribers();
    } catch (err) {
      setError(err);
      console.error("Error fetching user:", err);
      if (err.response?.status === 401) {
        TokenManager.clearTokens();
        cache.user = null;
        cache.timestamp = null;
        setUser(null);
      }
    } finally {
      setLoading(false);
      cache.loading = false;
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Подписываемся на изменения токена
    const handleStorageChange = (e) => {
      if (e.key === TOKEN_CONFIG.ACCESS_TOKEN_KEY) {
        fetchUser(true);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Подписываемся на обновления кэша
    const handleUpdate = (newUser) => {
      setUser(newUser);
    };
    cache.subscribers.add(handleUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      cache.subscribers.delete(handleUpdate);
    };
  }, [fetchUser]);

  const updateUser = useCallback(async (userData) => {
    try {
      const updatedUser = await UserService.updateProfile(userData);
      cache.user = updatedUser;
      cache.timestamp = Date.now();
      notifySubscribers();
      return updatedUser;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateStatus = useCallback(async (status) => {
    try {
      const updatedUser = await UserService.updateStatus(status);
      cache.user = updatedUser;
      cache.timestamp = Date.now();
      notifySubscribers();
      return updatedUser;
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    user,
    loading,
    error,
    updateUser,
    updateStatus,
    refetch: useCallback(() => fetchUser(true), [fetchUser]),
  };
};
