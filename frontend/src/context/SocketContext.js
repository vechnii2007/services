import React, { createContext } from "react";
import useSocket from "../hooks/useSocket";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketData = useSocket();
  return (
    <SocketContext.Provider value={socketData}>
      {children}
    </SocketContext.Provider>
  );
};
