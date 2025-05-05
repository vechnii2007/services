import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import AppContent from "./components/AppContent";
import { ChatModalProvider, useChatModal } from "./context/ChatModalContext";
import ChatModal from "./components/ChatModal/ChatModal";

const ChatModalRoot = () => {
  const { isOpen, requestId, userId, providerId, request, closeChat } =
    useChatModal();
  const dialogRef = useRef(null);
  const [modalKey, setModalKey] = useState(0); // Ключ для принудительного перерендера

  useEffect(() => {
    // Когда isOpen меняется на true, увеличиваем ключ для принудительного пересоздания компонента
    if (isOpen) {
      setModalKey((prev) => prev + 1);
    }
  }, [isOpen, requestId, userId, providerId, request]);

  return (
    <ChatModal
      key={modalKey} // Добавляем ключ для принудительного пересоздания при изменении
      open={isOpen}
      onClose={(event, reason) => {
        closeChat();
      }}
      requestId={requestId || ""}
      userId={userId}
      providerId={providerId}
      request={request}
      ref={dialogRef}
    />
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <ChatModalProvider>
        <Router>
          <AppContent />
          <ChatModalRoot />
        </Router>
      </ChatModalProvider>
    </ThemeProvider>
  );
};

export default App;
