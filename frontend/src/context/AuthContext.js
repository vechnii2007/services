import React, { createContext, useState, useEffect } from "react";
import api from "../middleware/api";
import { useUser } from "../hooks/useUser";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user, loading: userLoading, error, updateUser, refetch } = useUser();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isInitialized, setIsInitialized] = useState(false);

  // Проверяем валидность токена при инициализации
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        setIsInitialized(true);
        return;
      }

      try {
        await api.get("/users/me");
        setToken(storedToken);
      } catch (error) {
        console.error("Token validation failed:", error);
        localStorage.removeItem("token");
        setToken(null);
      } finally {
        setIsInitialized(true);
      }
    };

    validateToken();
  }, []);

  // Обработка изменений токена
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      refetch(); // Обновляем данные пользователя при изменении токена
    } else {
      localStorage.removeItem("token");
    }
  }, [token, refetch]);

  // Обработка событий авторизации между вкладками
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        setToken(e.newValue);
      }
    };

    const handleLogout = () => {
      setToken(null);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-logout", handleLogout);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-logout", handleLogout);
    };
  }, []);

  const login = async (email, password) => {
    try {
      console.log("Attempting login with:", { email });
      const response = await api.post("/users/login", {
        email,
        password,
      });
      console.log("Login response:", response.data);

      if (response.data && response.data.token) {
        setToken(response.data.token);
        return response.data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Login error:", error.response || error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post("/users/register", userData);
      setToken(response.data.token);
      return response.data;
    } catch (error) {
      throw (
        error.response?.data?.error || "An error occurred during registration"
      );
    }
  };

  const logout = () => {
    setToken(null);
  };

  const value = {
    user,
    token,
    loading: userLoading || !isInitialized,
    error,
    login,
    register,
    logout,
    updateProfile: updateUser,
    isAuthenticated: !!token && !!user,
  };

  // Не рендерим детей, пока не завершится инициализация
  if (!isInitialized) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
