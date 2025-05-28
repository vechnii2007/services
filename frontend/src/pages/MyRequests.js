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
  Tabs,
  Tab,
} from "@mui/material";
import { useChatModal } from "../context/ChatModalContext";
import ChatService from "../services/ChatService";
import { useAuth } from "../hooks/useAuth";

const MyRequests = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState(0); // 0 - заказчик, 1 - исполнитель
  const [requests, setRequests] = useState([]); // мои заказы
  const [providerRequests, setProviderRequests] = useState([]); // где я исполнитель
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
      if (isFetchingData.current) return;
      isFetchingData.current = true;
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError(t("please_login"));
          navigate("/login");
          return;
        }
        // Мои заказы (я заказчик)
        const res = await axios.get("/services/my-requests");
        setRequests(res.data);
        // Заказы, где я исполнитель
        if (user && user._id) {
          const res2 = await axios.get(
            `/services/requests?providerId=${user._id}`
          );
          setProviderRequests(res2.data);
        }
        setError("");
      } catch (error) {
        if (axios.isCancel && axios.isCancel(error)) {
          // Игнорируем отмену дублирующегося запроса
          return;
        }
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
  }, [navigate, t, user]);

  if (loading) {
    return <Typography>{t("loading")}</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  // --- UI для одной заявки ---
  const renderRequestCard = (request, isProviderTab = false) => {
    const providers = getProvidersForRequest(request._id);
    const offer =
      request.offerId && typeof request.offerId === "object"
        ? request.offerId
        : null;
    return (
      <Grid item xs={12} sm={6} md={4} key={request._id}>
        <Card>
          <CardContent>
            {offer && (
              <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Предложение:</strong>{" "}
                  <Link
                    to={`/offers/${offer._id}`}
                    style={{ textDecoration: "underline" }}
                  >
                    {offer.title || "(без названия)"}
                  </Link>
                </Typography>
                <Typography variant="body2">
                  <strong>Тип услуги:</strong> {offer.serviceType}
                </Typography>
                {offer.location && (
                  <Typography variant="body2">
                    <strong>Локация:</strong> {offer.location}
                  </Typography>
                )}
              </>
            )}
            <Typography variant="body1">
              <strong>{t("service_type")}:</strong> {t(request.serviceType)}
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
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, mr: 1 }}
              onClick={() => navigate(`/requests/${request._id}`)}
            >
              {t("details")}
            </Button>
            {/* Кнопка чата (оставляем как есть) */}
            {request.providerId === null ? (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ mt: 2 }}
                  onClick={(e) => handleOpenProviderMenu(e, request._id)}
                  disabled={getProvidersForRequest(request._id).length === 0}
                >
                  {t("chat")}
                </Button>
                <Menu
                  anchorEl={providerMenus[request._id]?.anchorEl}
                  open={Boolean(providerMenus[request._id]?.anchorEl)}
                  onClose={() => handleCloseProviderMenu(request._id)}
                >
                  {getProvidersForRequest(request._id).length === 0 ? (
                    <MenuItem disabled>{t("no_providers_for_chat")}</MenuItem>
                  ) : (
                    getProvidersForRequest(request._id).map((provider) => (
                      <MenuItem
                        key={provider._id}
                        onClick={() =>
                          handleSelectProvider(request._id, provider)
                        }
                      >
                        {provider.name || provider.email || provider._id}
                      </MenuItem>
                    ))
                  )}
                </Menu>
              </>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => openChat(request._id)}
              >
                {t("chat")}
              </Button>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t("my_requests")}
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={t("as_customer", "Я заказчик")} />
        <Tab label={t("as_provider", "Я исполнитель")} />
      </Tabs>
      {tab === 0 ? (
        requests.length > 0 ? (
          <Grid container spacing={3}>
            {[...requests]
              .sort((a, b) => {
                // Сортируем: in_progress > pending > completed > confirmed > cancelled > остальные
                const statusOrder = {
                  in_progress: 0,
                  pending: 1,
                  completed: 2,
                  confirmed: 3,
                  cancelled: 4,
                };
                return (
                  (statusOrder[a.status] ?? 99) -
                    (statusOrder[b.status] ?? 99) ||
                  new Date(b.createdAt) - new Date(a.createdAt)
                );
              })
              .map((request) => (
                <Grid item xs={12} sm={6} md={4} key={request._id}>
                  <Card
                    sx={[
                      (request.status === "in_progress" ||
                        request.status === "pending") && {
                        border: "2px solid #1976d2",
                        boxShadow: 4,
                      },
                    ]}
                  >
                    <CardContent>
                      {renderRequestCard(request, false)}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        ) : (
          <Typography variant="body1" align="center">
            {t("no_requests")}
          </Typography>
        )
      ) : providerRequests.length > 0 ? (
        <Grid container spacing={3}>
          {providerRequests.map((request) => renderRequestCard(request, true))}
        </Grid>
      ) : (
        <Typography variant="body1" align="center">
          {t("no_requests_as_provider", "Нет заказов, где вы исполнитель")}
        </Typography>
      )}
    </Box>
  );
};

export default MyRequests;
