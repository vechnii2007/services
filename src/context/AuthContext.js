import React, { useEffect } from "react";

const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const loadUser = () => {
    // Implementation of loadUser
  };

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider value={{ loadUser }}>{children}</AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
