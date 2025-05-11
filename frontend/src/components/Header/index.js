import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Button,
  Badge,
  useTheme,
  Avatar,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  AccountCircle,
  Message as MessageIcon,
  LocalOffer as OfferIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { formatDistance } from "date-fns";
import { ru } from "date-fns/locale";
import NotificationService from "../../services/NotificationService";
import ChatService from "../../services/ChatService";
import { useSocket } from "../../hooks/useSocket";
import Drawer from "@mui/material/Drawer";
import useMediaQuery from "@mui/material/useMediaQuery";
import logo from "../../assets/images/logo.svg";
import { useChatModal } from "../../context/ChatModalContext";
import { SocketContext } from "../../context/SocketContext";
import { menuItems } from "../menuConfig";
import SpainFlag from "../../assets/flags/es.svg";
import UkraineFlag from "../../assets/flags/ua.svg";
import RussiaFlag from "../../assets/flags/ru.svg";

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
  onAction,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case "message":
        return <MessageIcon color="info" />;
      case "offer":
        return <OfferIcon color="success" />;
      case "status":
        return <UpdateIcon color="primary" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <IconButton
          edge="end"
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification._id);
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      }
    >
      <ListItemButton
        onClick={() => onAction(notification)}
        sx={{
          backgroundColor: notification.read ? "transparent" : "action.hover",
          "&:hover": {
            backgroundColor: notification.read
              ? "action.hover"
              : "action.selected",
          },
          borderRadius: 1,
          my: 0.5,
        }}
      >
        <ListItemIcon>{getIcon()}</ListItemIcon>
        <ListItemText
          primary={
            <Typography
              variant="body2"
              color={notification.read ? "text.primary" : "primary"}
              sx={{
                fontWeight: notification.read ? "regular" : "medium",
                fontSize: "0.875rem",
                wordBreak: "break-word",
                whiteSpace: "pre-line",
                overflowWrap: "break-word",
                maxWidth: "100%",
                display: "block",
              }}
            >
              {notification.message}
            </Typography>
          }
          secondary={
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                maxWidth: "100%",
                display: "block",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-line",
              }}
            >
              {formatDistance(new Date(notification.createdAt), new Date(), {
                addSuffix: true,
                locale: ru,
              })}
            </Typography>
          }
          sx={{
            maxWidth: "100%",
            display: "block",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-line",
          }}
        />
        {!notification.read && (
          <Box
            component="span"
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "primary.main",
              ml: 1,
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );
};

const languages = [
  {
    code: "es",
    name: "Español",
    flag: SpainFlag,
    nativeName: "Español",
  },
  {
    code: "uk",
    name: "Українська",
    flag: UkraineFlag,
    nativeName: "Українська",
  },
  {
    code: "ru",
    name: "Русский",
    flag: RussiaFlag,
    nativeName: "Русский",
  },
];

// --- NotificationsPanel ---
const NotificationsPanel = ({
  notifications,
  loading,
  unreadCount,
  onMarkAllAsRead,
  onMarkAsRead,
  onDelete,
  onAction,
  onViewAll,
  t,
  navigate,
  handleNotificationsClose,
}) => (
  <Box
    sx={{
      width: { xs: 320, sm: 420 },
      maxWidth: 480,
      maxHeight: { xs: "80vh", sm: "70vh" },
      overflow: "auto",
      p: 0,
    }}
  >
    <Box
      sx={{
        p: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        gap: 2,
        flexWrap: "nowrap",
      }}
    >
      <Typography variant="h6" sx={{ minWidth: 120 }}>
        {t("notifications")}
      </Typography>
      <Box
        sx={{ display: "flex", gap: 1.5, flexWrap: "nowrap", width: "auto" }}
      >
        {unreadCount > 0 && (
          <Button
            size="small"
            onClick={onMarkAllAsRead}
            disabled={loading}
            sx={{ minWidth: 120, whiteSpace: "normal" }}
          >
            {t("mark_all_read")}
          </Button>
        )}
        <Button
          size="small"
          onClick={onViewAll}
          sx={{ minWidth: 120, whiteSpace: "normal" }}
        >
          {t("view_all")}
        </Button>
      </Box>
    </Box>
    <Divider />
    {loading ? (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    ) : notifications.length > 0 ? (
      <List sx={{ p: 0 }}>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification._id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onDelete={onDelete}
            onAction={onAction}
          />
        ))}
      </List>
    ) : (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">{t("no_notifications")}</Typography>
      </Box>
    )}
  </Box>
);

const Header = ({ onDrawerToggle }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useContext(SocketContext);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { openChat } = useChatModal();
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  // --- Состояния для Drawer уведомлений на мобиле ---
  const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);

  const handleLangMenu = (event) => setLangAnchorEl(event.currentTarget);

  const handleNotificationsClick = async (event) => {
    if (!user) return;
    if (isMobile) {
      setMobileNotificationsOpen(true);
    } else {
      setNotificationsAnchor(event.currentTarget);
    }
    if (!notifications.length) {
      await loadNotifications();
    }
  };

  const handleLangClose = () => setLangAnchorEl(null);
  const handleNotificationsClose = () => setNotificationsAnchor(null);

  // Настройка WebSocket для получения уведомлений в реальном времени
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    console.log("[Header] Setting up real-time notifications");

    // Функция обработки полученного уведомления
    const handleNewNotification = (notification) => {
      console.log("[Header] Received real-time notification:", notification);

      // Проверяем, нет ли такого уведомления уже в списке
      setNotifications((prev) => {
        const exists = prev.some((n) => n._id === notification._id);
        if (exists) {
          return prev;
        }
        // Добавляем новое уведомление в начало списка
        return [notification, ...prev];
      });
    };

    // Функция обработки нового сообщения
    const handleNewMessage = (messageData) => {
      console.log("[Header] Received private message:", messageData);

      // Если сообщение от другого пользователя (не от текущего)
      if (messageData.senderId && user && messageData.senderId !== user._id) {
        // Показываем уведомление, если страница не активна
        if (
          document.visibilityState !== "visible" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          const sender = messageData.senderName || "Пользователь";
          const message =
            messageData.message || messageData.text || "Новое сообщение";

          const notification = new Notification(`Сообщение от ${sender}`, {
            body: message,
            icon: "/favicon.ico",
          });

          notification.onclick = () => {
            window.focus();

            // Проверяем наличие ID запроса для перехода к чату
            if (messageData.requestId) {
              console.log(
                `[Header] Navigating to chat with requestId: ${messageData.requestId}`
              );
              openChat(messageData.requestId);
            } else {
              console.log(
                `[Header] No requestId found in message, navigating to chat list`
              );
              navigate(`/chat-list`);
            }
          };
        }
      }
    };

    // Подписываемся на уведомления через WebSocket
    const notificationsCleanup =
      NotificationService.setupWebSocketNotifications(
        socket,
        handleNewNotification
      );

    // Подписываемся на сообщения чата
    socket.on("private_message", handleNewMessage);

    return () => {
      // Дополнительная проверка, что notificationsCleanup - это функция
      if (notificationsCleanup && typeof notificationsCleanup === "function") {
        try {
          console.log("[Header] Running notification cleanup function");
          notificationsCleanup();
        } catch (error) {
          console.error("[Header] Error cleaning up notifications:", error);
        }
      } else {
        console.warn(
          "[Header] No valid cleanup function available for notifications"
        );
      }

      // Проверка доступности сокета перед отписыванием от событий
      if (socket) {
        try {
          socket.off("private_message", handleNewMessage);
          console.log(
            "[Header] Successfully unsubscribed from private_message events"
          );
        } catch (error) {
          console.error(
            "[Header] Error unsubscribing from private_message:",
            error
          );
        }
      } else {
        console.warn("[Header] Socket not available during cleanup");
      }
    };
  }, [socket, isConnected, user, navigate, openChat]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await NotificationService.getNotifications({ limit: 5 });
      setNotifications(response.notifications || []);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await NotificationService.deleteNotification(id);
      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== id)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await NotificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    handleLangClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationAction = (notification) => {
    // Отметить как прочитанное
    handleMarkAsRead(notification._id);
    // Переход по типу уведомления
    if (notification.type === "message" && notification.requestId) {
      openChat(notification.requestId);
      handleNotificationsClose();
    } else if (notification.type === "offer" && notification.relatedId) {
      navigate(`/offers/${notification.relatedId}`);
      handleNotificationsClose();
    } else if (
      (notification.type === "status" || notification.type === "request") &&
      notification.relatedId
    ) {
      navigate(`/requests/${notification.relatedId}`);
      handleNotificationsClose();
    }
  };

  // Drawer-меню для мобильных
  const handleDrawerItemClick = (item) => {
    if (item.isLogout) {
      handleLogout();
      setDrawerOpen(false);
      return;
    }
    if (item.path) {
      navigate(item.path);
      setDrawerOpen(false);
      return;
    }
  };

  // Находим текущий язык
  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const drawerContent = (
    <Box
      sx={{ width: 260, p: 2, pt: { xs: 7, sm: 8 } }}
      role="presentation"
      onClick={() => setDrawerOpen(false)}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Avatar src={user?.avatar} alt={user?.name} sx={{ mr: 1 }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {user ? user.name : t("guest")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user ? user.email : ""}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ mb: 1 }} />
      <List>
        {menuItems
          .filter((item) => item.show(user))
          .map((item) => (
            <ListItem
              button
              key={item.key}
              onClick={() => handleDrawerItemClick(item)}
            >
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              <ListItemText primary={t(item.label)} />
            </ListItem>
          ))}
      </List>
      {/* Языковое меню для Drawer */}
      <Menu
        anchorEl={langAnchorEl}
        open={Boolean(langAnchorEl)}
        onClose={handleLangClose}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={i18n.language === lang.code}
            sx={{ py: 1, display: "flex", alignItems: "center" }}
          >
            <img
              src={lang.flag}
              alt={lang.name}
              style={{
                width: 24,
                height: 18,
                marginRight: 12,
                boxShadow: "0 0 4px rgba(0,0,0,0.2)",
              }}
            />
            <Typography variant="body2">{lang.nativeName}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.primary.main,
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {isMobile ? (
          <>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 1 }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Box
              sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}
            >
              <Box
                component="img"
                src={logo}
                alt="UniServ Logo"
                sx={{ height: 36, cursor: "pointer" }}
                onClick={() => navigate("/")}
              />
            </Box>
            <Drawer
              anchor="left"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              ModalProps={{ keepMounted: true }}
            >
              {drawerContent}
            </Drawer>
            <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
              <IconButton color="inherit" onClick={handleLangMenu}>
                <img
                  src={currentLanguage.flag}
                  alt={currentLanguage.code}
                  style={{
                    width: 24,
                    height: 18,
                    borderRadius: 2,
                    boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                  }}
                />
              </IconButton>
              {user && (
                <IconButton color="inherit" onClick={handleNotificationsClick}>
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              )}
            </Box>
            {/* Drawer для уведомлений на мобиле */}
            <Drawer
              anchor="top"
              open={mobileNotificationsOpen}
              onClose={() => setMobileNotificationsOpen(false)}
              PaperProps={{
                sx: { borderRadius: "0 0 16px 16px", top: "56px" },
              }}
            >
              <NotificationsPanel
                notifications={notifications}
                loading={loading}
                unreadCount={unreadCount}
                onMarkAllAsRead={handleMarkAllAsRead}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onAction={handleNotificationAction}
                onViewAll={() => {
                  navigate("/notifications");
                  setMobileNotificationsOpen(false);
                }}
                t={t}
                navigate={navigate}
                handleNotificationsClose={() =>
                  setMobileNotificationsOpen(false)
                }
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => setMobileNotificationsOpen(false)}
                sx={{ m: 2, width: "calc(100% - 32px)" }}
              >
                {t("close")}
              </Button>
            </Drawer>
          </>
        ) : (
          // Десктопная версия (оставляем как есть)
          <>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={onDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
            <Box
              component="img"
              src={logo}
              alt="UniServ Logo"
              sx={{
                height: 40,
                mr: 1,
                cursor: "pointer",
                "&:hover": { opacity: 0.9 },
              }}
              onClick={() => navigate("/")}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton color="inherit" onClick={handleLangMenu}>
                <img
                  src={currentLanguage.flag}
                  alt={currentLanguage.code}
                  style={{
                    width: 24,
                    height: 18,
                    borderRadius: 2,
                    boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                  }}
                />
              </IconButton>
              <Menu
                anchorEl={langAnchorEl}
                open={Boolean(langAnchorEl)}
                onClose={handleLangClose}
              >
                {languages.map((lang) => (
                  <MenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    selected={i18n.language === lang.code}
                    sx={{ py: 1, display: "flex", alignItems: "center" }}
                  >
                    <img
                      src={lang.flag}
                      alt={lang.name}
                      style={{
                        width: 24,
                        height: 18,
                        marginRight: 12,
                        boxShadow: "0 0 4px rgba(0,0,0,0.2)",
                      }}
                    />
                    <Typography variant="body2">{lang.nativeName}</Typography>
                  </MenuItem>
                ))}
              </Menu>
              {user && (
                <IconButton color="inherit" onClick={handleNotificationsClick}>
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              )}
              <Popover
                open={Boolean(notificationsAnchor)}
                anchorEl={notificationsAnchor}
                onClose={handleNotificationsClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    width: { xs: 420, sm: 420 },
                    maxWidth: 480,
                    maxHeight: { xs: "80vh", sm: "70vh" },
                    overflow: "auto",
                    mt: 1,
                    boxShadow: theme.shadows[8],
                  },
                }}
                sx={{
                  width: { xs: 420, sm: 420 },
                  "& .MuiPopover-paper": {
                    width: { xs: 420, sm: 420 },
                    left: { xs: "0 !important", sm: "auto" },
                    right: { xs: "0 !important", sm: "auto" },
                  },
                }}
              >
                <NotificationsPanel
                  notifications={notifications}
                  loading={loading}
                  unreadCount={unreadCount}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onAction={handleNotificationAction}
                  onViewAll={() => {
                    navigate("/notifications");
                    handleNotificationsClose();
                  }}
                  t={t}
                  navigate={navigate}
                  handleNotificationsClose={handleNotificationsClose}
                />
              </Popover>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
