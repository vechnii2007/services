import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../middleware/api";
import { useUser, resetUser } from "../hooks/useUser";

export const AuthContext = createContext(null);

// Добавляем хук useAuth для удобного доступа к контексту
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth должен использоваться внутри AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const {
    user,
    loading: userLoading,
    error,
    updateUser,
    refetch,
  } = useUser(token);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (error) console.error("[AuthContext] error:", error);
  }, [user, error]);

  const login = async (email, password) => {
    try {
      const response = await api.post("/users/login", {
        email,
        password,
      });

      if (response.data && response.data.token) {
        setToken(response.data.token);
        return response.data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
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
    resetUser();
  };

  const isAuthenticated = Boolean(token && user);

  const value = {
    user,
    token,
    loading: userLoading,
    error,
    login,
    register,
    logout,
    updateProfile: updateUser,
    isAuthenticated,
    refetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {!userLoading && children}
    </AuthContext.Provider>
  );
};
