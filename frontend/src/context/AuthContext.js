import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../middleware/api";
import { useUser } from "../hooks/useUser";

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
  const { user, loading: userLoading, error, updateUser } = useUser();
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      // console.log("Attempting login with:", { email });
      const response = await api.post("/users/login", {
        email,
        password,
      });
      // console.log("Login response:", response.data);

      if (response.data && response.data.token) {
        setToken(response.data.token);
        await updateUser();
        return response.data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      // console.error("Login error:", error.response || error);
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
    // updateUser(null); // удалено, чтобы не было бесконечного цикла
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!userLoading && children}
    </AuthContext.Provider>
  );
};
