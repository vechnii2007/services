import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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
import toast, { Toaster } from "react-hot-toast";
import { SocketContext } from "../context/SocketContext";
import useNotification from "../composables/useNotification";
import api from "../middleware/api";
import UniversalBreadcrumbs from "./Breadcrumbs/UniversalBreadcrumbs";

// Избегаем частых ререндеров за счет мемоизации компонента
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
  const { socket } = useContext(SocketContext);
  const { addNotification } = useNotification();

  // Используем useRef для хранения информации о монтировании/размонтировании без вызова ререндеров
  const mountInfoRef = React.useRef({
    mounted: false,
    mountTime: new Date().toISOString(),
  });

  // Определяем, находимся ли на лендинге - мемоизируем для предотвращения лишних ререндеров
  const isLandingPage = useMemo(
    () => location.pathname === "/",
    [location.pathname]
  );

  // Определяем, находимся ли на странице offers
  const isOffersPage = useMemo(
    () => location.pathname === "/offers",
    [location.pathname]
  );

  // Мемоизируем обработчик открытия/закрытия боковой панели
  const toggleDrawer = useCallback(
    (open) => () => {
      setDrawerOpen(open);
    },
    []
  );

  // Флаг для защиты от повторного открытия чата
  const lastOpenedRequestIdRef = React.useRef(null);

  // Выносим обработку пути для чата в отдельный эффект
  useEffect(() => {
    const match = matchPath("/chat/:requestId", location.pathname);
    if (match && match.params && match.params.requestId) {
      if (lastOpenedRequestIdRef.current === match.params.requestId) {
        return;
      }
      if (!isOpen || modalRequestId !== match.params.requestId) {
        const {
          userId,
          providerId,
          requestId: stateRequestId,
        } = location.state || {};
        const openWithParams = (params) => {
          openChat(params);
          lastOpenedRequestIdRef.current = match.params.requestId;
          // navigate(location.pathname, { replace: true, state: {} }); // Временно убираем
        };
        if (userId && providerId) {
          openWithParams({
            requestId: match.params.requestId,
            userId,
            providerId,
          });
        } else {
          (async () => {
            try {
              const response = await api.get(
                `/services/requests/${match.params.requestId}`
              );
              const data = response.data;
              const userIdApi = data.userId?._id || data.userId;
              const providerIdApi = data.providerId?._id || data.providerId;
              if (userIdApi && providerIdApi) {
                openWithParams({
                  requestId: match.params.requestId,
                  userId: userIdApi,
                  providerId: providerIdApi,
                });
              } else {
                openWithParams(match.params.requestId); // fallback
              }
            } catch (err) {
              openWithParams(match.params.requestId); // fallback
            }
          })();
        }
      }
    } else {
      lastOpenedRequestIdRef.current = null;
      if (isOpen) {
        closeChat();
      }
    }
  }, [
    location.pathname,
    modalRequestId,
    isOpen,
    openChat,
    closeChat,
    location.state,
    navigate,
  ]);

  // Логирование монтирования компонента без вызова повторных рендеров
  useEffect(() => {
    if (!mountInfoRef.current.mounted) {
      mountInfoRef.current.mounted = true;
    }

    return () => {
      mountInfoRef.current.mounted = false;
      mountInfoRef.current.mountTime = new Date().toISOString();
    };
  }, []);

  // Обработка закрытия модалки: возвращаем на /chat-list
  useEffect(() => {
    if (!isOpen && matchPath("/chat/:requestId", location.pathname)) {
      navigate("/chat-list", { replace: true });
    }
  }, [isOpen, location.pathname, navigate]);

  // Показываем toast при получении уведомления по сокету
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      toast(notification.message || t("Новое уведомление"), { icon: "🔔" });
      if (addNotification) {
        addNotification(notification);
      }
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket, t, addNotification]);

  // Мемоизируем маршруты для предотвращения ненужных перерендеров
  const routes = useMemo(() => {
    return routesConfig.map(({ path, element, requiredRole }) => (
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
    ));
  }, [user]);

  // Мемоизируем состояние загрузки, чтобы избежать ненужных перерендеров
  const loadingState = useMemo(() => {
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
    return null;
  }, [loading, t]);

  // Мемоизируем рендеринг шапки и бокового меню
  const header = !isLandingPage && (
    <Header onDrawerToggle={toggleDrawer(true)} />
  );
  const sideMenu = !isLandingPage && (
    <SideMenu open={drawerOpen} onClose={toggleDrawer(false)} />
  );

  // Мемоизируем основные стили для контейнера контента
  const contentStyles = useMemo(
    () => ({
      flexGrow: 1,
      p: isLandingPage ? 0 : 3, // Убираем отступы для лендинга
      mt: 0, // Увеличен отступ от хедера
      width: "100%",
      maxWidth: "100%",
      overflowX: "hidden",
    }),
    [isLandingPage]
  );

  // Отступ для хлебных крошек, чтобы не попадали под AppBar
  const breadcrumbsMarginTop = isLandingPage ? 0 : { xs: 8, sm: 9 };

  if (loadingState) {
    return loadingState;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Отображаем хедер только если не находимся на лендинге */}
      {header}

      {/* Хлебные крошки под хедером, кроме лендинга и страницы offers */}
      {!isLandingPage && !isOffersPage && (
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: 1, mt: breadcrumbsMarginTop }}>
          <UniversalBreadcrumbs />
        </Box>
      )}

      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Отображаем сайдбар только если не находимся на лендинге */}
        {sideMenu}

        <Box component="main" sx={contentStyles}>
          <Toaster />
          <Routes>{routes}</Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default AppContent;
