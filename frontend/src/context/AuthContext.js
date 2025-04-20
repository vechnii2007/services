import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../middleware/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/users/me");
      setUser(response.data);
    } catch (error) {
      console.error("Error loading user:", error);
      if (error.response?.status === 401) {
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

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
        setUser(response.data.user);
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
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw (
        error.response?.data?.error || "An error occurred during registration"
      );
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put("/users/profile", profileData);
      setUser(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || "An error occurred updating profile";
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
