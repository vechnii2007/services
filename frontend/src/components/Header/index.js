import React, { useState, useEffect, useContext } from "react";
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
  Message as MessageIcon,
  LocalOffer as OfferIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
  Brightness4,
  Brightness7,
  AccountCircle,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { formatDistance } from "date-fns";
import { ru } from "date-fns/locale";
import NotificationService from "../../services/NotificationService";
import Drawer from "@mui/material/Drawer";
import useMediaQuery from "@mui/material/useMediaQuery";
import logo from "../../assets/images/logo.svg";
import { useChatModal } from "../../context/ChatModalContext";
import { SocketContext } from "../../context/SocketContext";
import { menuItems, userMenuItems, mainMenuItems } from "../menuConfig";
import SpainFlag from "../../assets/flags/es.svg";
import UkraineFlag from "../../assets/flags/ua.svg";
import RussiaFlag from "../../assets/flags/ru.svg";
import { useThemeMode } from "../../context/ThemeContext";

const NotificationItem = ({ notification, onDelete, onAction }) => {
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

const ThemeToggleButton = () => {
  const { mode, toggleTheme } = useThemeMode();
  return (
    <IconButton
      color="inherit"
      onClick={toggleTheme}
      sx={{ ml: 1 }}
      aria-label="toggle theme"
    >
      {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
};

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
  const [unreadCount, setUnreadCount] = useState(0);
  // --- Состояния для Drawer уведомлений на мобиле ---
  const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);
  // --- state for auth menu ---
  const [authMenuAnchor, setAuthMenuAnchor] = useState(null);

  const handleLangMenu = (event) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLangClose = () => {
    setLangAnchorEl(null);
  };

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

  const handleNotificationsClose = () => setNotificationsAnchor(null);

  // Настройка WebSocket для получения уведомлений в реальном времени
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Функция обработки полученного уведомления
    const handleNewNotification = (notification) => {
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
              openChat(messageData.requestId);
            } else {
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
      if (notificationsCleanup && typeof notificationsCleanup === "function") {
        try {
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

  const unreadRequestsCount = notifications.filter(
    (n) => !n.read && n.type === "request"
  ).length;

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
    const path = typeof item.path === "function" ? item.path(user) : item.path;
    if (path) {
      navigate(path);
      setDrawerOpen(false);
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
        {mainMenuItems
          .filter((item) => item.show(user))
          .map((item) => (
            <ListItem
              button
              key={item.key}
              onClick={() => handleDrawerItemClick(item)}
              component={item.path ? "div" : undefined}
            >
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              <ListItemText primary={t(item.label)} />
            </ListItem>
          ))}
      </List>
      <Divider sx={{ my: 1 }} />
      <List>
        {userMenuItems
          .filter((item) => item.show(user))
          .map((item) => (
            <ListItem
              button
              key={item.key}
              onClick={() => handleDrawerItemClick(item)}
              component={item.path ? "div" : undefined}
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

  // Получаем количество непрочитанных уведомлений при монтировании и логине
  useEffect(() => {
    if (user) {
      NotificationService.getUnreadCount()
        .then((count) => setUnreadCount(count))
        .catch(() => setUnreadCount(0));
    }
  }, [user]);

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
              <IconButton color="inherit" onClick={(e) => handleLangMenu(e)}>
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
                  {unreadRequestsCount > 0 && (
                    <Badge
                      badgeContent={unreadRequestsCount}
                      color="warning"
                      sx={{ ml: 1 }}
                    >
                      <NotificationsIcon fontSize="small" />
                    </Badge>
                  )}
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
            <ThemeToggleButton />
          </>
        ) : (
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
            <ThemeToggleButton />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton color="inherit" onClick={(e) => handleLangMenu(e)}>
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
              {/* Аватар пользователя и Drawer */}
              {!user && (
                <>
                  <IconButton
                    color="inherit"
                    onClick={(e) => setAuthMenuAnchor(e.currentTarget)}
                    sx={{ ml: 1 }}
                  >
                    <AccountCircle fontSize="large" />
                  </IconButton>
                  <Menu
                    anchorEl={authMenuAnchor}
                    open={Boolean(authMenuAnchor)}
                    onClose={() => setAuthMenuAnchor(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                  >
                    <MenuItem
                      onClick={() => {
                        setAuthMenuAnchor(null);
                        navigate("/login");
                      }}
                    >
                      {t("login")}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setAuthMenuAnchor(null);
                        navigate("/register");
                      }}
                    >
                      {t("register")}
                    </MenuItem>
                  </Menu>
                </>
              )}
              {user && (
                <IconButton color="inherit" onClick={handleNotificationsClick}>
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                  {unreadRequestsCount > 0 && (
                    <Badge
                      badgeContent={unreadRequestsCount}
                      color="warning"
                      sx={{ ml: 1 }}
                    >
                      <NotificationsIcon fontSize="small" />
                    </Badge>
                  )}
                </IconButton>
              )}
              {user && (
                <>
                  <IconButton
                    color="inherit"
                    onClick={() => setDrawerOpen(true)}
                  >
                    <Avatar src={user.avatar} alt={user.name} />
                  </IconButton>
                  <Drawer
                    anchor="right"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                  >
                    <Box sx={{ width: 260, p: 2, pt: { xs: 7, sm: 8 } }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Avatar
                          src={user.avatar}
                          alt={user.name}
                          sx={{ mr: 1 }}
                        />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ mb: 1 }} />
                      <List>
                        {userMenuItems
                          .filter((item) => item.show(user))
                          .map((item) => (
                            <ListItem
                              button
                              key={item.key}
                              onClick={() => handleDrawerItemClick(item)}
                            >
                              {item.icon && (
                                <ListItemIcon>{item.icon}</ListItemIcon>
                              )}
                              <ListItemText primary={t(item.label)} />
                            </ListItem>
                          ))}
                      </List>
                    </Box>
                  </Drawer>
                </>
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
