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
    console.log("[ChatModalContext] openChat called with params:", params);

    // Обновляем временную метку открытия
    lastOpenTimestampRef.current = Date.now();

    // Обрабатываем разные типы параметров
    if (typeof params === "string") {
      console.log("[ChatModalContext] Setting requestId:", params);
      setState({
        isOpen: true,
        requestId: params,
        userId: null,
        providerId: null,
        request: null,
      });
    } else {
      console.log("[ChatModalContext] Setting complex params:", params);
      setState({
        isOpen: true,
        requestId: params.requestId || null,
        userId: params.userId || null,
        providerId: params.providerId || null,
        request: params.request || null,
      });
    }

    console.log("[ChatModalContext] Chat opened");
  }, []);

  const closeChat = useCallback(() => {
    console.log("[ChatModalContext] closeChat called");

    // Защита от случайного закрытия сразу после открытия
    const now = Date.now();
    const timeSinceLastOpen = now - lastOpenTimestampRef.current;

    if (timeSinceLastOpen < safeCloseWindowMs) {
      console.log(
        `[ChatModalContext] Prevented accidental close: ${timeSinceLastOpen}ms after open`
      );
      return;
    }

    setState({
      isOpen: false,
      requestId: null,
      userId: null,
      providerId: null,
      request: null,
    });

    console.log("[ChatModalContext] Chat closed");
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
