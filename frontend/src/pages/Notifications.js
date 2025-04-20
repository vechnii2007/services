import React, { useState, useEffect } from "react";
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
  Tabs,
  Tab,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Divider,
  Container,
  ListItemSecondary,
  ListItemButton,
  Button,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  LocalOffer as OfferIcon,
  Update as UpdateIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  ErrorOutline as ErrorIcon,
} from "@mui/icons-material";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";
import { formatDistance } from "date-fns";
import { ru } from "date-fns/locale";

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
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();

  const loadNotifications = async (pageNum = 1, replace = true) => {
    try {
      setLoading(true);
      const data = await NotificationService.getNotifications({
        page: pageNum,
        limit: 20,
        unreadOnly: currentTab === 1,
      });

      const { notifications: newNotifications, pages } = data;

      setNotifications((prev) =>
        replace
          ? newNotifications || []
          : [...(prev || []), ...(newNotifications || [])]
      );
      setHasMore(pageNum < pages);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
      console.error("Error loading notifications:", err);
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

  useEffect(() => {
    loadNotifications();
  }, [currentTab]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        (prev || []).map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      setError(err.message);
      console.error("Error marking notification as read:", err);
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
      console.error("Error deleting notification:", err);
    }
  };

  const unreadCount = notifications
    ? notifications.filter((n) => !n.read).length
    : 0;

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <NotificationsIcon color="primary" />
          <Typography variant="h5" component="h1" color="text.primary">
            {t("notifications")}
          </Typography>
        </Box>

        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
        >
          <Tab
            label={t("all_notifications")}
            icon={<NotificationsIcon />}
            iconPosition="start"
          />
          <Tab
            label={t("unread")}
            icon={
              <Badge color="error" badgeContent={unreadCount}>
                <NotificationsIcon />
              </Badge>
            }
            iconPosition="start"
          />
        </Tabs>

        {loading && (!notifications || notifications.length === 0) ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : notifications && notifications.length > 0 ? (
          <List sx={{ width: "100%" }}>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
            {hasMore && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  pt: 2,
                  pb: 1,
                }}
              >
                <Button
                  startIcon={
                    loading ? <CircularProgress size={20} /> : <UpdateIcon />
                  }
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outlined"
                >
                  {t("load_more")}
                </Button>
              </Box>
            )}
          </List>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              py: 8,
            }}
          >
            <NotificationsIcon color="action" sx={{ fontSize: 48 }} />
            <Typography color="text.secondary" align="center">
              {t("no_notifications")}
            </Typography>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Notifications;
