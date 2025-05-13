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
          mb: { xs: 1, sm: 2 },
          transition: "all 0.2s ease",
          borderLeft:
            unreadCount > 0
              ? `5px solid ${theme.palette.primary.main}`
              : undefined,
          boxShadow: unreadCount > 0 ? theme.shadows[3] : theme.shadows[1],
          background: unreadCount > 0 ? theme.palette.action.hover : undefined,
          borderRadius: { xs: 1, sm: 2 },
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: theme.shadows[4],
            background: theme.palette.action.selected,
          },
          "&:active": {
            background: theme.palette.action.focus,
          },
        }}
        onClick={() => {
          const userId = chat.userId?._id || chat.userId || (user && user._id);
          openChat({
            requestId: chat.requestId || chat._id,
            providerId: chat.providerId?._id || chat.providerId,
            userId,
            request: chat,
          });
        }}
      >
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ gap: { xs: 1, sm: 2 } }}
          >
            <Box
              display="flex"
              alignItems="center"
              sx={{ gap: { xs: 1, sm: 2 } }}
            >
              <ListItemAvatar sx={{ minWidth: 40 }}>
                <Avatar
                  alt={otherParty?.name || "User"}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    width: { xs: 36, sm: 44 },
                    height: { xs: 36, sm: 44 },
                    fontSize: { xs: 18, sm: 22 },
                  }}
                >
                  {otherParty?.name ? (
                    otherParty.name.charAt(0).toUpperCase()
                  ) : (
                    <PersonIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                  )}
                </Avatar>
              </ListItemAvatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography
                    variant="subtitle2"
                    noWrap
                    fontWeight={unreadCount > 0 ? "bold" : "normal"}
                    component={Link}
                    to={profileLink}
                    sx={{
                      textDecoration: "none",
                      color: "inherit",
                      fontSize: { xs: "1rem", sm: "1.1rem" },
                      maxWidth: { xs: 120, sm: 180 },
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {otherParty?.name || t("chat")}
                  </Typography>
                  {unreadCount > 0 && (
                    <Badge
                      color="error"
                      badgeContent={"NEW"}
                      sx={{
                        ml: 0.5,
                        "& .MuiBadge-badge": {
                          fontSize: "0.7rem",
                          height: 16,
                          minWidth: 16,
                        },
                      }}
                    />
                  )}
                  {unreadCount > 0 && (
                    <Badge
                      color="primary"
                      badgeContent={unreadCount}
                      sx={{
                        ml: 0.5,
                        "& .MuiBadge-badge": {
                          fontSize: "0.7rem",
                          height: 16,
                          minWidth: 16,
                        },
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    maxWidth: { xs: 170, sm: 250 },
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    fontSize: { xs: "0.92rem", sm: "1rem" },
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
                <Box
                  display="flex"
                  alignItems="center"
                  mt={0.5}
                  gap={0.5}
                  flexWrap="wrap"
                >
                  <Chip
                    label={chat.serviceType || t("no_service_type")}
                    size="small"
                    sx={{
                      maxWidth: 90,
                      fontSize: "0.7rem",
                      height: 22,
                      px: 0.5,
                      mb: 0.5,
                    }}
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
                    sx={{
                      maxWidth: 90,
                      fontSize: "0.7rem",
                      height: 22,
                      px: 0.5,
                      mb: 0.5,
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "0.75rem", ml: 0.5, minWidth: 50 }}
                  >
                    {timeAgo}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <IconButton
              color="primary"
              size="small"
              sx={{ ml: 0.5, p: 0.5, fontSize: { xs: 18, sm: 22 } }}
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
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
    <Box
      sx={{
        width: "100%",
        maxWidth: { xs: "100%", md: 800 },
        mx: { xs: 0, md: "auto" },
        p: { xs: 1, sm: 2, md: 4 },
        boxSizing: "border-box",
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        mb={2}
        justifyContent="space-between"
        sx={{ px: { xs: 1, sm: 2, md: 0 } }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.5rem" } }}
        >
          {t("chat_list")}
        </Typography>
        <Badge badgeContent={totalUnread} color="error">
          <ChatIcon color="primary" sx={{ fontSize: { xs: 22, sm: 26 } }} />
        </Badge>
      </Box>

      <Paper
        sx={{
          mb: 2,
          overflow: "hidden",
          borderRadius: { xs: 1, sm: 2 },
          boxShadow: { xs: 0, sm: 1 },
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          sx={{ minHeight: { xs: 36, sm: 48 } }}
        >
          <Tab
            label={
              <Badge
                badgeContent={userRequests.reduce(
                  (count, chat) => count + (unreadCounts[chat._id] || 0),
                  0
                )}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    right: -10,
                    top: 6,
                    fontSize: "0.7rem",
                  },
                }}
              >
                <Box sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                  {t("my_requests")}
                </Box>
              </Badge>
            }
            sx={{ minHeight: { xs: 36, sm: 48 }, px: { xs: 1, sm: 2 } }}
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
                  sx={{
                    "& .MuiBadge-badge": {
                      right: -10,
                      top: 6,
                      fontSize: "0.7rem",
                    },
                  }}
                >
                  <Box sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
                    {t("available_requests")}
                  </Box>
                </Badge>
              }
              sx={{ minHeight: { xs: 36, sm: 48 }, px: { xs: 1, sm: 2 } }}
            />
          )}
        </Tabs>
        <Divider />
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
          {tabValue === 0 && (
            <>
              {getSortedChats(userRequests).length > 0 ? (
                getSortedChats(userRequests).map((chat) =>
                  renderChatItem(chat, false)
                )
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.95rem", sm: "1.05rem" } }}
                  >
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
                  <Box textAlign="center" py={3}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.95rem", sm: "1.05rem" } }}
                    >
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
