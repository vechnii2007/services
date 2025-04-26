import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useTranslation } from "react-i18next";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Tabs,
  Tab,
  Paper,
  Chip,
  CircularProgress,
  useTheme,
  IconButton,
} from "@mui/material";
import {
  ChatBubbleOutline as ChatIcon,
  Person as PersonIcon,
  FiberManualRecord as UnreadIcon,
  ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

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
        console.log("User requests:", userRes.data);
        setUserRequests(userRes.data);

        // Получаем запросы, на которые пользователь (поставщик) отправил предложения
        const providerRes = await axios.get(`/services/provider-chats`);
        console.log("Provider requests:", providerRes.data);
        setProviderRequests(providerRes.data);

        // Получаем статистику непрочитанных сообщений
        // Имитация данных, в реальном приложении должен быть запрос к API
        const unreadData = {};
        [...userRes.data, ...providerRes.data].forEach((chat) => {
          unreadData[chat._id] = chat.unreadCount || 0;
        });
        setUnreadCounts(unreadData);

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
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [t, navigate]);

  const renderChatItem = (chat) => {
    const unreadCount = unreadCounts[chat._id] || 0;
    const lastActivity = chat.lastActivity || chat.updatedAt || chat.createdAt;
    const timeAgo = lastActivity
      ? formatDistanceToNow(new Date(lastActivity), {
          addSuffix: true,
          locale: ru,
        })
      : "";

    return (
      <Card
        key={chat._id}
        sx={{
          mb: 2,
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: theme.shadows[4],
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
                  alt={chat.otherPartyName || "User"}
                  src={chat.otherPartyAvatar}
                  sx={{
                    bgcolor: !chat.otherPartyAvatar
                      ? theme.palette.primary.main
                      : undefined,
                  }}
                >
                  {!chat.otherPartyAvatar && <PersonIcon />}
                </Avatar>
              </ListItemAvatar>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box display="flex" alignItems="center">
                  <Typography
                    variant="subtitle1"
                    noWrap
                    fontWeight={unreadCount > 0 ? "bold" : "normal"}
                  >
                    {chat.serviceType ? t(chat.serviceType) : t("chat")}
                  </Typography>
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
                  {chat.description || t("no_description")}
                </Typography>

                <Box display="flex" alignItems="center" mt={0.5}>
                  <Chip
                    label={chat.location || t("no_location")}
                    size="small"
                    sx={{ mr: 1, maxWidth: 120, fontSize: "0.7rem" }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {timeAgo}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <IconButton
              color="primary"
              component={Link}
              to={`/chat/${chat._id}`}
              size="small"
              sx={{ ml: 1 }}
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
        </Tabs>

        <Divider />

        <Box sx={{ p: 2 }}>
          {tabValue === 0 && (
            <>
              {userRequests.length > 0 ? (
                userRequests.map(renderChatItem)
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    {t("no_requests")}
                  </Typography>
                </Box>
              )}
            </>
          )}

          {tabValue === 1 && (
            <>
              {providerRequests.length > 0 ? (
                providerRequests.map(renderChatItem)
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
