import React, { createContext, useContext, useState, useCallback } from "react";

const ChatModalContext = createContext();

export const ChatModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [requestId, setRequestId] = useState(null);

  const openChat = useCallback((id) => {
    setRequestId(id);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setRequestId(null);
  }, []);

  return (
    <ChatModalContext.Provider
      value={{ isOpen, requestId, openChat, closeChat }}
    >
      {children}
    </ChatModalContext.Provider>
  );
};

export const useChatModal = () => useContext(ChatModalContext);
