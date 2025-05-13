import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import NotificationService from "../services/NotificationService";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Badge,
  CircularProgress,
  Alert,
  Container,
  ListItemButton,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  LocalOffer as OfferIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useSocket } from "../hooks/useSocket";
import { formatDistance } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContext";
import api from "../middleware/api";

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const { t } = useTranslation();
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
          aria-label={t("delete")}
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
              variant="body1"
              color={notification.read ? "text.primary" : "primary"}
              sx={{ fontWeight: notification.read ? "regular" : "medium" }}
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

const Notifications = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setCurrentTab] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications(1, true);
    // eslint-disable-next-line
  }, []);

  const loadNotifications = async (pageNum = 1, replace = true) => {
    try {
      setLoading(true);
      const data = await NotificationService.getNotifications({
        page: pageNum,
        limit: 20,
      });
      let newNotifications, pages;
      if (Array.isArray(data)) {
        newNotifications = data;
        pages = 1;
      } else if (data.notifications) {
        newNotifications = data.notifications;
        pages = data.pages || 1;
      } else {
        newNotifications = [];
        pages = 1;
      }
      setNotifications((prev) =>
        replace
          ? newNotifications || []
          : [...(prev || []), ...(newNotifications || [])]
      );
      setHasMore(pageNum < pages);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (newNotification) => {
      setNotifications((prev) => [newNotification, ...(prev || [])]);
    };
    socket.on("notification", handleNewNotification);
    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [socket]);

  const handleMarkAsReadAndNavigate = async (notification) => {
    try {
      if (!notification.read) {
        await NotificationService.markAsRead(notification._id);
        setNotifications((prev) =>
          (prev || []).map((notif) =>
            notif._id === notification._id ? { ...notif, read: true } : notif
          )
        );
      }
      if (notification.type === "request") {
        navigate(`/requests/${notification.relatedId}`, {
          state: { fromNotification: true },
        });
      } else if (notification.type === "offer") {
        navigate(`/offers/${notification.relatedId}`);
      } else if (notification.type === "message") {
        let userId, providerId, requestId;
        requestId = notification.relatedId;
        try {
          const response = await api.get(`/services/requests/${requestId}`);
          const data = response.data;
          userId = data.userId?._id || data.userId;
          providerId = data.providerId?._id || data.providerId;
        } catch (err) {
          setError("Не удалось получить данные чата для уведомления");
          return;
        }
        if (userId && providerId && requestId) {
          navigate(`/chat/${requestId}`, {
            state: { userId, providerId, requestId, fromNotification: true },
          });
        } else {
          setError("Не удалось определить участников чата");
        }
      }
    } catch (err) {
      setError(err.message);
      alert(
        "Не удалось открыть уведомление. Возможно, запрос был удалён или у вас нет доступа."
      );
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    loadNotifications(page + 1, false);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleDelete = async (id) => {
    try {
      await NotificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const unreadCount = notifications
    ? notifications.filter((n) => !n.read).length
    : 0;

  return (
    <Container maxWidth="md" sx={{ paddingY: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("notifications")}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : notifications && notifications.length > 0 ? (
        <List>
          {notifications.map((notif) => (
            <ListItem
              key={notif._id || notif.id}
              divider
              button
              onClick={() => handleMarkAsReadAndNavigate(notif)}
              sx={{ cursor: "pointer" }}
            >
              <ListItemIcon>
                {notif.type === "message" ? (
                  <MessageIcon color="primary" />
                ) : notif.type === "offer" ? (
                  <OfferIcon color="secondary" />
                ) : notif.type === "request" ? (
                  <UpdateIcon color="info" />
                ) : (
                  <NotificationsIcon color="action" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={notif.message || t("no_message")}
                secondary={
                  notif.createdAt
                    ? formatDistance(new Date(notif.createdAt), new Date(), {
                        addSuffix: true,
                        locale: ru,
                      })
                    : null
                }
              />
              {notif.read ? null : <Badge color="error" variant="dot" />}
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography
          variant="body1"
          align="center"
          color="textSecondary"
          sx={{ mt: 4 }}
        >
          {t("no_notifications")}
        </Typography>
      )}
    </Container>
  );
};

export default Notifications;
