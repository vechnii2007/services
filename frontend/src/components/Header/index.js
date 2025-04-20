import React, { useState, useEffect } from "react";
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
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { formatDistance } from "date-fns";
import { ru } from "date-fns/locale";
import axios from "../../utils/axiosConfig";

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
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
        onClick={() => onMarkAsRead(notification._id)}
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
              }}
            >
              {notification.message}
            </Typography>
          }
          secondary={
            <Typography variant="caption" color="text.secondary">
              {formatDistance(new Date(notification.createdAt), new Date(), {
                addSuffix: true,
                locale: ru,
              })}
            </Typography>
          }
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

const Header = ({ onDrawerToggle }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleLangMenu = (event) => setLangAnchorEl(event.currentTarget);

  const handleNotificationsClick = async (event) => {
    setNotificationsAnchor(event.currentTarget);
    if (!notifications.length) {
      await loadNotifications();
    }
  };

  const handleClose = () => setAnchorEl(null);
  const handleLangClose = () => setLangAnchorEl(null);
  const handleNotificationsClose = () => setNotificationsAnchor(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/services/notifications`, {
        params: { limit: 5 },
      });
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/services/notifications/${notificationId}/read`);
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
      await axios.delete(`/api/services/notifications/${id}`);
      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== id)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    handleLangClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    handleClose();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.primary.main,
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
          onClick={onDrawerToggle}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Service Portal
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Язык */}
          <IconButton color="inherit" onClick={handleLangMenu}>
            <LanguageIcon />
          </IconButton>
          <Menu
            anchorEl={langAnchorEl}
            open={Boolean(langAnchorEl)}
            onClose={handleLangClose}
          >
            <MenuItem onClick={() => handleLanguageChange("ru")}>
              Русский
            </MenuItem>
            <MenuItem onClick={() => handleLanguageChange("en")}>
              English
            </MenuItem>
          </Menu>

          {/* Уведомления */}
          <IconButton
            color="inherit"
            onClick={handleNotificationsClick}
            aria-label={t("notifications")}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Popover
            open={Boolean(notificationsAnchor)}
            anchorEl={notificationsAnchor}
            onClose={handleNotificationsClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            PaperProps={{
              sx: {
                width: { xs: "100%", sm: 360 },
                maxWidth: "100%",
                maxHeight: { xs: "80vh", sm: "70vh" },
                overflow: "auto",
                mt: 1,
                boxShadow: theme.shadows[8],
              },
            }}
            sx={{
              width: { xs: "100%", sm: "auto" },
              "& .MuiPopover-paper": {
                width: { xs: "100%", sm: 360 },
                left: { xs: "0 !important", sm: "auto" },
                right: { xs: "0 !important", sm: "auto" },
              },
            }}
          >
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">{t("notifications")}</Typography>
              <Button
                size="small"
                onClick={() => {
                  navigate("/notifications");
                  handleNotificationsClose();
                }}
              >
                {t("view_all")}
              </Button>
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
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                  {t("no_notifications")}
                </Typography>
              </Box>
            )}
          </Popover>

          {/* Профиль */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {user ? (
              <>
                <IconButton
                  onClick={handleMenu}
                  color="inherit"
                  sx={{ padding: 0.5 }}
                >
                  {user.avatar ? (
                    <Avatar src={user.avatar} alt={user.name} />
                  ) : (
                    <AccountCircle />
                  )}
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem
                    onClick={() => {
                      navigate("/profile");
                      handleClose();
                    }}
                  >
                    {t("profile")}
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>{t("logout")}</MenuItem>
                </Menu>
              </>
            ) : (
              <Button color="inherit" onClick={() => navigate("/login")}>
                {t("login")}
              </Button>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
