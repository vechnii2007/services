import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

const ChatModalContext = createContext();

export const ChatModalProvider = ({ children }) => {
  // Состояние для отслеживания открытия и параметров чата
  const [state, setState] = useState({
    isOpen: false,
    requestId: null,
    userId: null,
    providerId: null,
    request: null,
  });

  // Используем реф для защиты от закрытия сразу после открытия
  const lastOpenTimestampRef = useRef(0);
  const safeCloseWindowMs = 500; // Защитный интервал в мс

  // Избегаем использования нескольких состояний, которые могут
  // рассинхронизироваться при быстрых действиях пользователя
  const openChat = useCallback((params) => {
    // Обновляем временную метку открытия
    lastOpenTimestampRef.current = Date.now();

    // Обрабатываем разные типы параметров
    if (typeof params === "string") {
      setState({
        isOpen: true,
        requestId: params,
        userId: null,
        providerId: null,
        request: null,
      });
    } else {
      setState({
        isOpen: true,
        requestId: params.requestId || null,
        userId: params.userId || null,
        providerId: params.providerId || null,
        request: params.request || null,
      });
    }
  }, []);

  const closeChat = useCallback(() => {
    // Защита от случайного закрытия сразу после открытия
    const now = Date.now();
    const timeSinceLastOpen = now - lastOpenTimestampRef.current;

    if (timeSinceLastOpen < safeCloseWindowMs) {
      return;
    }

    setState({
      isOpen: false,
      requestId: null,
      userId: null,
      providerId: null,
      request: null,
    });
  }, []);

  // Очистка состояния при размонтировании
  useEffect(() => {
    return () => {
      setState({
        isOpen: false,
        requestId: null,
        userId: null,
        providerId: null,
        request: null,
      });
    };
  }, []);

  return (
    <ChatModalContext.Provider
      value={{
        ...state,
        openChat,
        closeChat,
      }}
    >
      {children}
    </ChatModalContext.Provider>
  );
};

export const useChatModal = () => useContext(ChatModalContext);
