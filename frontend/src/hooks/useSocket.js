import { useEffect, useState, useCallback, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "./useAuth";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || "https://services-cnr9.onrender.com";
const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState(null);
  const reconnectAttemptsRef = useRef(0);
  const { user } = useAuth();

  // Функция для отображения структуры событий
  const debugEvent = useCallback((data) => {
    try {
      // Анализ структуры объекта события
      if (data && typeof data === "object") {
        console.log(data);
      }
    } catch (e) {
      console.error(`[Socket Debug] Error analyzing event:`, e);
    }
  }, []);

  // Функция для подключения к сокет-серверу
  const connect = useCallback(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return null;
    }

    const newSocket = io(SOCKET_URL, {
      query: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      timeout: 10000,
    });

    return newSocket;
  }, []);

  // Управление подключением/отключением сокета
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !user) {
      return;
    }

    const newSocket = connect();
    if (!newSocket) return;

    // Обработчик успешного подключения
    const handleConnect = () => {
      setIsConnected(true);
      setLastError(null);
      reconnectAttemptsRef.current = 0;
    };

    // Обработчик ошибки подключения
    const handleConnectError = (error) => {
      setIsConnected(false);
      setLastError({
        type: "connect_error",
        message: error.message,
        time: new Date().toISOString(),
      });

      // Увеличиваем количество попыток переподключения
      reconnectAttemptsRef.current += 1;

      // Если достигли максимального количества попыток, останавливаем повторные попытки
      if (reconnectAttemptsRef.current >= RECONNECT_ATTEMPTS) {
        console.error(
          "[Socket] Maximum reconnection attempts reached, giving up"
        );
      }
    };

    // Обработчик общих ошибок
    const handleError = (error) => {
      console.error("[Socket] Error:", error);
      setLastError({
        type: "error",
        message: typeof error === "object" ? error.message : error,
        time: new Date().toISOString(),
      });
    };

    // Обработчик отключения
    const handleDisconnect = (reason) => {
      setIsConnected(false);
      setLastError({
        type: "disconnect",
        message: reason,
        time: new Date().toISOString(),
      });

      // Если отключение не является запланированным и не достигли максимального количества попыток,
      // пробуем переподключиться
      if (
        reason !== "io client disconnect" &&
        reason !== "transport close" &&
        reconnectAttemptsRef.current < RECONNECT_ATTEMPTS
      ) {
      }
    };

    // Обработчик переподключения
    const handleReconnect = (attemptNumber) => {
      setIsConnected(true);
      setLastError(null);
      reconnectAttemptsRef.current = 0;
    };

    // Подписка на ошибки токена авторизации
    const handleAuthError = (error) => {
      console.error("[Socket] Authentication error:", error);
      setLastError({
        type: "auth_error",
        message: error.message,
        time: new Date().toISOString(),
      });

      // При ошибке авторизации не пытаемся переподключаться
      newSocket.disconnect();
    };

    // Подписка на события
    newSocket.on("connect", handleConnect);
    newSocket.on("connect_error", handleConnectError);
    newSocket.on("error", handleError);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("reconnect", handleReconnect);
    newSocket.on("auth_error", handleAuthError);

    // Добавляем отладочную информацию для события private_message
    newSocket.on("private_message", (data) => {
      debugEvent("private_message", data);
    });

    // Добавляем отладочную информацию для события notification
    newSocket.on("notification", (data) => {
      debugEvent("notification", data);
    });

    setSocket(newSocket);

    // Очистка при размонтировании компонента
    return () => {
      if (newSocket) {
        newSocket.off("connect", handleConnect);
        newSocket.off("connect_error", handleConnectError);
        newSocket.off("error", handleError);
        newSocket.off("disconnect", handleDisconnect);
        newSocket.off("reconnect", handleReconnect);
        newSocket.off("auth_error", handleAuthError);
        newSocket.off("private_message");
        newSocket.off("notification");
        newSocket.disconnect();
      }
    };
  }, [connect, debugEvent, user]);

  // Функция для переподключения сокета
  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();

      // Небольшая задержка перед переподключением
      setTimeout(() => {
        const newSocket = connect();
        if (newSocket) {
          setSocket(newSocket);
        }
      }, 500);
    }
  }, [socket, connect]);

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
    reconnect,
  };
};

export default useSocket;
