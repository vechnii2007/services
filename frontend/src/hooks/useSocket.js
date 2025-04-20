import { useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./useAuth";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5001";

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Создаем новое подключение
    const newSocket = io(SOCKET_URL, {
      query: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Обработчики событий подключения
    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    setSocket(newSocket);

    // Очистка при размонтировании
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [token]);

  return { socket };
};
