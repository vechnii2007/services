import { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5001";

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Функция для отображения структуры событий
  const debugEvent = useCallback((eventName, data) => {
    console.log(`[Socket Debug] Received ${eventName} event:`, data);
    try {
      // Анализ структуры объекта события
      if (data && typeof data === "object") {
        const structure = {
          type: typeof data,
          keys: Object.keys(data),
          hasId: !!data._id,
          hasMessage: !!data.message || !!data.text,
          hasSenderId: !!data.senderId,
          hasRecipientId: !!data.recipientId,
          hasRequestId: !!data.requestId,
        };
        console.log(`[Socket Debug] ${eventName} structure:`, structure);
      }
    } catch (e) {
      console.error(`[Socket Debug] Error analyzing event:`, e);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[Socket] No token found, skipping socket connection");
      return;
    }

    console.log("[Socket] Connecting to socket server:", SOCKET_URL);
    const newSocket = io(SOCKET_URL, {
      query: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected successfully", {
        id: newSocket.id,
        connected: newSocket.connected,
      });
      setIsConnected(true);
      setLastError(null);
    });

    newSocket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error);
      setIsConnected(false);
      setLastError({
        type: "connect_error",
        message: error.message,
        time: new Date().toISOString(),
      });
    });

    newSocket.on("error", (error) => {
      console.error("[Socket] Error:", error);
      setLastError({
        type: "error",
        message: typeof error === "object" ? error.message : error,
        time: new Date().toISOString(),
      });
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      setIsConnected(false);
      setLastError({
        type: "disconnect",
        message: reason,
        time: new Date().toISOString(),
      });
    });

    // Добавляем отладочную информацию для события private_message
    newSocket.on("private_message", (data) => {
      debugEvent("private_message", data);
    });

    // Добавляем отладочную информацию для других событий
    newSocket.onAny((eventName, ...args) => {
      if (
        eventName !== "connect" &&
        eventName !== "disconnect" &&
        eventName !== "connect_error" &&
        eventName !== "error" &&
        eventName !== "private_message"
      ) {
        console.log(`[Socket] Event '${eventName}' received:`, args);
      }
    });

    setSocket(newSocket);

    return () => {
      console.log("[Socket] Cleaning up socket connection");
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [debugEvent]);

  // Функция для отправки тестового сообщения для отладки
  const sendTestMessage = useCallback(
    (requestId, recipientId, message = "test") => {
      if (!socket || !isConnected) {
        console.error(
          "[Socket] Cannot send test message: Socket not connected"
        );
        return false;
      }

      try {
        const testMessage = {
          requestId,
          recipientId,
          message,
          timestamp: new Date().toISOString(),
        };

        console.log("[Socket] Sending test message:", testMessage);
        socket.emit("private_message", testMessage);
        return true;
      } catch (error) {
        console.error("[Socket] Error sending test message:", error);
        return false;
      }
    },
    [socket, isConnected]
  );

  return {
    socket,
    isConnected,
    lastError,
    sendTestMessage,
  };
};

export default useSocket;
