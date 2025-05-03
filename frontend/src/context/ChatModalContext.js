import React, { createContext, useContext, useState, useCallback } from "react";

const ChatModalContext = createContext();

export const ChatModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatParams, setChatParams] = useState({
    requestId: null,
    userId: null,
    providerId: null,
  });

  const openChat = useCallback((params) => {
    if (typeof params === "string") {
      setChatParams({ requestId: params, userId: null, providerId: null });
    } else {
      setChatParams({
        requestId: params.requestId || null,
        userId: params.userId || null,
        providerId: params.providerId || null,
      });
    }
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setChatParams({ requestId: null, userId: null, providerId: null });
  }, []);

  return (
    <ChatModalContext.Provider
      value={{ isOpen, ...chatParams, openChat, closeChat }}
    >
      {children}
    </ChatModalContext.Provider>
  );
};

export const useChatModal = () => useContext(ChatModalContext);
