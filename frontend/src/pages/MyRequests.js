import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../utils/axiosConfig"; // Используем настроенный axios
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import { useChatModal } from "../context/ChatModalContext";
import ChatService from "../services/ChatService";

const MyRequests = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const isFetchingData = useRef(false); // Флаг для предотвращения дубликатов
  const { openChat } = useChatModal();
  const [providerMenus, setProviderMenus] = useState({}); // { [requestId]: { anchorEl, providers: [] } }

  // Получаем список чатов пользователя для поиска провайдеров по каждому запросу
  const [myChats, setMyChats] = useState([]);
  useEffect(() => {
    ChatService.getMyChats().then((chats) => {
      setMyChats(chats);
    });
  }, []);

  // Получить провайдеров для данного запроса
  const getProvidersForRequest = (requestId) => {
    return myChats
      .filter((chat) => chat.requestId === requestId && chat.provider)
      .map((chat) => chat.provider);
  };

  // Открыть меню выбора провайдера
  const handleOpenProviderMenu = (event, requestId) => {
    const providers = getProvidersForRequest(requestId);
    setProviderMenus((prev) => ({
      ...prev,
      [requestId]: { anchorEl: event.currentTarget, providers },
    }));
  };
  // Закрыть меню
  const handleCloseProviderMenu = (requestId) => {
    setProviderMenus((prev) => ({
      ...prev,
      [requestId]: { ...prev[requestId], anchorEl: null },
    }));
  };
  // Открыть чат с выбранным провайдером
  const handleSelectProvider = (requestId, provider) => {
    openChat({ requestId, providerId: provider._id });
    handleCloseProviderMenu(requestId);
  };

  useEffect(() => {
    const fetchRequests = async () => {
      if (isFetchingData.current) {
        return;
      }

      isFetchingData.current = true;
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError(t("please_login"));
          navigate("/login");
          return;
        }
        const res = await axios.get("/services/my-requests");
        setRequests(res.data);
        setError("");
      } catch (error) {
        setError(
          t("error_fetching_requests") +
            ": " +
            (error.response?.data?.error || t("something_went_wrong"))
        );
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
        isFetchingData.current = false;
      }
    };
    fetchRequests();
  }, [navigate, t]);

  if (loading) {
    return <Typography>{t("loading")}</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t("my_requests")}
      </Typography>
      {requests.length > 0 ? (
        <Grid container spacing={3}>
          {requests.map((request) => {
            const providers = getProvidersForRequest(request._id);
            return (
              <Grid item xs={12} sm={6} md={4} key={request._id}>
                <Card>
                  <CardContent>
                    <Typography variant="body1">
                      <strong>{t("service_type")}:</strong>{" "}
                      {t(request.serviceType)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>{t("location")}:</strong> {request.location}
                    </Typography>
                    <Typography variant="body1">
                      <strong>{t("description")}:</strong> {request.description}
                    </Typography>
                    <Typography variant="body1">
                      <strong>{t("status")}:</strong> {request.status}
                    </Typography>
                    <Typography variant="body1">
                      <strong>{t("created_at")}:</strong>{" "}
                      {new Date(request.createdAt).toLocaleString()}
                    </Typography>
                    {/* Кнопка чата с выбором провайдера для общих запросов */}
                    {request.providerId === null ? (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          sx={{ marginTop: 2 }}
                          onClick={(e) =>
                            handleOpenProviderMenu(e, request._id)
                          }
                          disabled={
                            getProvidersForRequest(request._id).length === 0
                          }
                        >
                          {t("chat")}
                        </Button>
                        <Menu
                          anchorEl={providerMenus[request._id]?.anchorEl}
                          open={Boolean(providerMenus[request._id]?.anchorEl)}
                          onClose={() => handleCloseProviderMenu(request._id)}
                        >
                          {getProvidersForRequest(request._id).length === 0 ? (
                            <MenuItem disabled>
                              {t("no_providers_for_chat")}
                            </MenuItem>
                          ) : (
                            getProvidersForRequest(request._id).map(
                              (provider) => (
                                <MenuItem
                                  key={provider._id}
                                  onClick={() =>
                                    handleSelectProvider(request._id, provider)
                                  }
                                >
                                  {provider.name ||
                                    provider.email ||
                                    provider._id}
                                </MenuItem>
                              )
                            )
                          )}
                        </Menu>
                      </>
                    ) : (
                      <Button
                        variant="outlined"
                        color="primary"
                        sx={{ marginTop: 2 }}
                        onClick={() => openChat(request._id)}
                      >
                        {t("chat")}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography variant="body1" align="center">
          {t("no_requests")}
        </Typography>
      )}
    </Box>
  );
};

export default MyRequests;
