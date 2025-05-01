import React, { useContext, useState, useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  matchPath,
} from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Header from "./Header/index";
import SideMenu from "./SideMenu";
import RouteGuard from "../utils/RouteGuard";
import { routesConfig } from "../utils/routesConfig";
import { AuthContext } from "../context/AuthContext";
import { useChatModal } from "../context/ChatModalContext";

const AppContent = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {
    openChat,
    closeChat,
    isOpen,
    requestId: modalRequestId,
  } = useChatModal();
  const navigate = useNavigate();

  // Определяем, находимся ли на лендинге
  const isLandingPage = location.pathname === "/";

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  useEffect(() => {
    // Проверяем, совпадает ли путь с /chat/:requestId
    const match = matchPath("/chat/:requestId", location.pathname);
    if (match && match.params && match.params.requestId) {
      // Если модалка уже открыта с этим requestId, ничего не делаем
      if (!isOpen || modalRequestId !== match.params.requestId) {
        openChat(match.params.requestId);
      }
    }
    // Если мы не на /chat/:requestId, но модалка открыта — закрываем её
    if (!match && isOpen) {
      closeChat();
    }
    // eslint-disable-next-line
  }, [location.pathname]);

  // Обработка закрытия модалки: возвращаем на /chat-list
  useEffect(() => {
    if (!isOpen && matchPath("/chat/:requestId", location.pathname)) {
      navigate("/chat-list", { replace: true });
    }
    // eslint-disable-next-line
  }, [isOpen, location.pathname]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography>{t("loading")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Отображаем хедер только если не находимся на лендинге */}
      {!isLandingPage && <Header onDrawerToggle={toggleDrawer(true)} />}

      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Отображаем сайдбар только если не находимся на лендинге */}
        {!isLandingPage && (
          <SideMenu
            open={drawerOpen}
            onClose={toggleDrawer(false)}
            user={user}
          />
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: isLandingPage ? 0 : 3, // Убираем отступы для лендинга
            mt: isLandingPage ? 0 : { xs: 8, sm: 9 }, // Увеличен отступ от хедера
            width: "100%",
            maxWidth: "100%",
            overflowX: "hidden",
          }}
        >
          <Routes>
            {routesConfig.map(({ path, element, requiredRole }) => (
              <Route
                key={path}
                path={path}
                element={
                  requiredRole ? (
                    <RouteGuard user={user} requiredRole={requiredRole}>
                      {element}
                    </RouteGuard>
                  ) : (
                    element
                  )
                }
              />
            ))}
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default AppContent;
