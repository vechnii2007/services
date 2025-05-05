import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useTranslation } from "react-i18next";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Badge,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  useTheme,
  IconButton,
  ListItemAvatar,
  Paper,
  Divider,
} from "@mui/material";
import {
  Person as PersonIcon,
  ArrowForward as ArrowIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useChatModal } from "../context/ChatModalContext";
import { useAuth } from "../context/AuthContext";
import ChatService from "../services/ChatService";

const ChatList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [userRequests, setUserRequests] = useState([]);
  const [providerRequests, setProviderRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({});
  const { openChat } = useChatModal();
  const { user } = useAuth();
  const [lastMessages, setLastMessages] = useState({});

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage(t("please_login"));
          navigate("/login");
          return;
        }

        // Получаем запросы, созданные пользователем
        const userRes = await axios.get(`/services/my-chats`);
        setUserRequests(userRes.data);

        let providerRes = { data: [] };
        if (user && (user.role === "provider" || user.role === "admin")) {
          providerRes = await axios.get(`/services/provider-chats`);
          setProviderRequests(providerRes.data);
        } else {
          setProviderRequests([]);
        }

        // Получаем статистику непрочитанных сообщений
        // Имитация данных, в реальном приложении должен быть запрос к API
        const unreadData = {};
        [...userRes.data, ...providerRes.data].forEach((chat) => {
          unreadData[chat._id] = chat.unreadCount || 0;
        });
        setUnreadCounts(unreadData);

        // После загрузки чатов — грузим последние сообщения для превью
        const allChats = [...userRes.data, ...providerRes.data];
        const lastMsgs = {};
        await Promise.all(
          allChats.map(async (chat) => {
            const msgs = await ChatService.getMessages(
              chat.requestId || chat._id
            );
            if (msgs && msgs.length > 0) {
              lastMsgs[chat.requestId || chat._id] = msgs[msgs.length - 1];
            }
          })
        );
        setLastMessages(lastMsgs);

        setMessage(t("requests_loaded"));
      } catch (error) {
        if (error.response) {
          setMessage(
            "Error: " + (error.response.data.error || t("something_went_wrong"))
          );
          if (error.response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
          }
        } else if (error.request) {
          setMessage(t("no_response_from_server"));
        } else {
          setMessage("Error: " + error.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [t, navigate, user]);

  // Сортировка чатов по дате последнего сообщения (новые сверху)
  const getSortedChats = (chats) => {
    return [...chats].sort((a, b) => {
      const lastA =
        lastMessages[a.requestId || a._id]?.timestamp ||
        a.lastActivity ||
        a.updatedAt ||
        a.createdAt;
      const lastB =
        lastMessages[b.requestId || b._id]?.timestamp ||
        b.lastActivity ||
        b.updatedAt ||
        b.createdAt;
      return new Date(lastB) - new Date(lastA);
    });
  };

  const renderChatItem = (chat, isProviderTab = false) => {
    const unreadCount = unreadCounts[chat._id] || 0;
    const lastMsg = lastMessages[chat.requestId || chat._id];
    const lastActivity =
      lastMsg?.timestamp ||
      chat.lastActivity ||
      chat.updatedAt ||
      chat.createdAt;
    const timeAgo = lastActivity
      ? formatDistanceToNow(new Date(lastActivity), {
          addSuffix: true,
          locale: ru,
        })
      : "";
    // Определяем собеседника и ссылку на профиль
    let otherParty = null;
    let profileLink = "#";
    if (user?.role === "provider" || isProviderTab) {
      otherParty = chat.user || chat.userId;
      profileLink = `/profile/${otherParty?._id || otherParty}`;
    } else {
      otherParty = chat.provider || chat.providerId;
      profileLink = `/profile/${otherParty?._id || otherParty}`;
    }
    return (
      <Card
        key={chat._id || `${chat.requestId}_${chat.providerId || chat.userId}`}
        sx={{
          mb: 2,
          transition: "all 0.2s ease",
          borderLeft:
            unreadCount > 0
              ? `5px solid ${theme.palette.primary.main}`
              : undefined,
          boxShadow: unreadCount > 0 ? theme.shadows[4] : theme.shadows[1],
          background: unreadCount > 0 ? theme.palette.action.hover : undefined,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: theme.shadows[6],
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center">
              <ListItemAvatar>
                <Avatar
                  alt={otherParty?.name || "User"}
                  sx={{ bgcolor: theme.palette.primary.main }}
                >
                  {otherParty?.name ? (
                    otherParty.name.charAt(0).toUpperCase()
                  ) : (
                    <PersonIcon />
                  )}
                </Avatar>
              </ListItemAvatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography
                    variant="subtitle1"
                    noWrap
                    fontWeight={unreadCount > 0 ? "bold" : "normal"}
                    component={Link}
                    to={profileLink}
                    sx={{ textDecoration: "none", color: "inherit" }}
                  >
                    {otherParty?.name || t("chat")}
                  </Typography>
                  {unreadCount > 0 && (
                    <Badge color="error" badgeContent={"NEW"} sx={{ ml: 1 }} />
                  )}
                  {unreadCount > 0 && (
                    <Badge
                      color="primary"
                      badgeContent={unreadCount}
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    maxWidth: "100%",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lastMsg?.message
                    ? `${
                        lastMsg.senderId?.name
                          ? lastMsg.senderId.name + ": "
                          : ""
                      }${lastMsg.message}`
                    : chat.description || t("no_description")}
                </Typography>
                <Box display="flex" alignItems="center" mt={0.5} gap={1}>
                  <Chip
                    label={chat.serviceType || t("no_service_type")}
                    size="small"
                    sx={{ maxWidth: 120, fontSize: "0.7rem" }}
                  />
                  <Chip
                    label={chat.status || t("no_status")}
                    size="small"
                    color={
                      chat.status === "pending"
                        ? "warning"
                        : chat.status === "active"
                        ? "success"
                        : "default"
                    }
                    sx={{ maxWidth: 120, fontSize: "0.7rem" }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {timeAgo}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <IconButton
              color="primary"
              size="small"
              sx={{ ml: 1 }}
              onClick={() => {
                openChat({
                  requestId: chat.requestId || chat._id,
                  providerId: chat.providerId,
                  userId: chat.userId,
                });
              }}
            >
              <ArrowIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const totalUnread = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Box
        display="flex"
        alignItems="center"
        mb={3}
        justifyContent="space-between"
      >
        <Typography variant="h5" fontWeight="bold">
          {t("chat_list")}
        </Typography>

        <Badge badgeContent={totalUnread} color="error">
          <ChatIcon color="primary" />
        </Badge>
      </Box>

      {message && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: theme.palette.background.default,
            borderLeft: `4px solid ${theme.palette.primary.main}`,
          }}
        >
          <Typography variant="body2" color="textSecondary">
            {message}
          </Typography>
        </Paper>
      )}

      <Paper sx={{ mb: 4, overflow: "hidden" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            label={
              <Badge
                badgeContent={userRequests.reduce(
                  (count, chat) => count + (unreadCounts[chat._id] || 0),
                  0
                )}
                color="error"
                sx={{ "& .MuiBadge-badge": { right: -15 } }}
              >
                <Box>{t("my_requests")}</Box>
              </Badge>
            }
          />
          {user && (user.role === "provider" || user.role === "admin") && (
            <Tab
              label={
                <Badge
                  badgeContent={providerRequests.reduce(
                    (count, chat) => count + (unreadCounts[chat._id] || 0),
                    0
                  )}
                  color="error"
                  sx={{ "& .MuiBadge-badge": { right: -15 } }}
                >
                  <Box>{t("available_requests")}</Box>
                </Badge>
              }
            />
          )}
        </Tabs>

        <Divider />

        <Box sx={{ p: 2 }}>
          {tabValue === 0 && (
            <>
              {getSortedChats(userRequests).length > 0 ? (
                getSortedChats(userRequests).map((chat) =>
                  renderChatItem(chat, false)
                )
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    {t("no_requests")}
                  </Typography>
                </Box>
              )}
            </>
          )}

          {tabValue === 1 &&
            user &&
            (user.role === "provider" || user.role === "admin") && (
              <>
                {getSortedChats(providerRequests).length > 0 ? (
                  getSortedChats(providerRequests).map((chat) =>
                    renderChatItem(chat, true)
                  )
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      {t("no_requests")}
                    </Typography>
                  </Box>
                )}
              </>
            )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatList;
