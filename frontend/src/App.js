import React, { useEffect, useRef, useState, useContext } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import AppContent from "./components/AppContent";
import { ChatModalProvider, useChatModal } from "./context/ChatModalContext";
import ChatModal from "./components/ChatModal/ChatModal";
import { AuthContext } from "./context/AuthContext";
import RegisterCompleteDialog from "./components/RegisterCompleteDialog";

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
  const { user, updateProfile, refetch, loading } = useContext(AuthContext);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(true);
  const [registerError, setRegisterError] = useState("");
  const handleRegisterComplete = async (values) => {
    setRegisterError("");
    try {
      await updateProfile({ ...values, socialLogin: false });
      setRegisterDialogOpen(false);
      if (typeof refetch === "function") await refetch();
    } catch (err) {
      setRegisterError("Ошибка при обновлении профиля");
    }
  };
  return (
    <ThemeProvider theme={theme}>
      <ChatModalProvider>
        <Router>
          <AppContent />
          <ChatModalRoot />
          {user && user.socialLogin === true && registerDialogOpen && (
            <RegisterCompleteDialog
              open={true}
              user={user}
              onComplete={handleRegisterComplete}
              loading={loading}
              error={registerError}
            />
          )}
        </Router>
      </ChatModalProvider>
    </ThemeProvider>
  );
};

export default App;
