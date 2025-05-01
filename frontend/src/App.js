import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import AppContent from "./components/AppContent";
import { ChatModalProvider, useChatModal } from "./context/ChatModalContext";
import ChatModal from "./components/ChatModal/ChatModal";

const ChatModalRoot = () => {
  const { isOpen, requestId, closeChat } = useChatModal();
  return (
    <ChatModal open={isOpen} onClose={closeChat} requestId={requestId || ""} />
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
