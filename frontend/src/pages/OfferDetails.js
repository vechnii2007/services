// src/pages/OfferDetails.js
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Zoom } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/zoom";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Alert,
  Divider,
  IconButton,
  Chip,
  Skeleton,
  Stack,
  Avatar,
  Paper,
  Dialog,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  DialogTitle,
} from "@mui/material";
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Room as RoomIcon,
  Category as CategoryIcon,
  Email as EmailIcon,
  Info as InfoIcon,
  Event as EventIcon,
  Chat as ChatIcon,
  Call as CallIcon,
  ZoomIn as ZoomInIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate, formatPrice } from "../utils/formatters";
import api from "../middleware/api";
import Reviews from "../components/Reviews";
import { useChatModal } from "../context/ChatModalContext";
import { SocketContext } from "../context/SocketContext";
import AuthRequiredModal from "../components/AuthRequiredModal";
import { useAuth } from "../hooks/useAuth";
import OfferForm from "../components/OfferCard/OfferForm";
import CreateOrderModal from "../components/OfferCard/CreateOrderModal";
import { useTheme } from "@mui/material/styles";

// Оборачиваем компоненты в motion
const MotionContainer = motion(Container);
const MotionCard = motion(Card);
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

const OfferDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { socket } = useContext(SocketContext);
  const { openChat } = useChatModal();
  const { user, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    let isMounted = true;

    const fetchOffer = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/services/offers/${id}`);
        if (isMounted) {
          setOffer(res.data);

          // Проверяем, находится ли предложение в избранном
          try {
            const favRes = await api.get("/services/favorites");
            const isInFavorites = favRes.data.some((fav) => fav._id === id);
            setIsFavorite(isInFavorites);
          } catch (favError) {
            console.error("Error checking favorites:", favError);
          }
        }
      } catch (error) {
        if (isMounted) {
          setError(error.response?.data?.error || t("something_went_wrong"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOffer();

    return () => {
      isMounted = false;
    };
  }, [id, t]);

  // Отдельный эффект для работы с сокетами
  useEffect(() => {
    if (!socket || !offer?.providerId?._id) return;

    const providerId = offer.providerId._id;
    // Используем ID предложения вместо ID пользователя для комнаты
    // Это будет совместимо с логикой сервера
    const roomId = offer._id;
    socket.emit("joinRoom", roomId);

    const handleNewMessage = (data) => {
      if (data.senderId === providerId) {
        setUnreadMessages((prev) => prev + 1);
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.emit("leaveRoom", roomId);
    };
  }, [socket, offer?.providerId?._id, offer?._id]);

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    try {
      if (isFavorite) {
        await api.delete(`/services/favorites/${id}`);
        setIsFavorite(false);
      } else {
        // Преобразуем тип предложения к формату, ожидаемому сервером
        const serverOfferType =
          offer.type === "offer"
            ? "Offer"
            : offer.type === "service_offer"
            ? "ServiceOffer"
            : offer.type || "Offer";

        await api.post("/services/favorites", {
          offerId: id,
          offerType: serverOfferType,
        });
        setIsFavorite(true);
      }
    } catch (error) {
      setError(error.response?.data?.error || t("something_went_wrong"));
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = offer?.title;
    let shareUrl;

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(
          title + " " + url
        )}`;
        break;
      default:
        navigator.clipboard.writeText(url);
        setShareAnchorEl(null);
        return;
    }

    window.open(shareUrl, "_blank", "noopener,noreferrer");
    setShareAnchorEl(null);
  };

  const handleContactProvider = async (e) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    // Останавливаем всплытие события, чтобы предотвратить конфликты
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }

    let response = null;

    try {
      const providerId = offer.providerId._id;
      const offerId = offer._id;

      // Сначала проверяем, существует ли уже запрос для этого предложения
      const existingRequests = await api.get("/services/requests", {
        params: {
          offerId,
          providerId,
        },
      });

      let requestId;

      if (existingRequests.data && existingRequests.data.length > 0) {
        // Используем существующий запрос
        requestId = existingRequests.data[0]._id;
      } else {
        // Создаем новый запрос
        response = await api.post("/services/requests", {
          providerId,
          serviceType: offer.serviceType,
          description: `Запрос по предложению: ${offer.title}`,
          offerId,
        });

        requestId = response.data._id;
      }

      // Переходим в чат - вызываем с небольшой задержкой для предотвращения конфликта событий
      setTimeout(() => {
        const chatRequest =
          existingRequests.data && existingRequests.data.length > 0
            ? existingRequests.data[0]
            : response?.data || null;
        openChat({
          requestId,
          providerId: offer.providerId?._id,
          userId: chatRequest?.userId?._id || chatRequest?.userId,
          request: chatRequest,
        });
      }, 100);

      // Сбрасываем счетчик непрочитанных сообщений
      setUnreadMessages(0);
    } catch (error) {
      setError(error.response?.data?.error || t("error_creating_chat"));
    }
  };

  // Для перехода в профиль провайдера
  const handleProviderProfileClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (safeProvider._id) {
      navigate(`/profile/${safeProvider._id}`);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ maxWidth: 1260, mx: "auto" }}>
          <Skeleton variant="text" width="50%" height={60} />
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={5} sx={{ width: "100%" }}>
              <Box sx={{ width: "100%" }}>
                <Skeleton
                  variant="rectangular"
                  sx={{
                    width: "100%",
                    height: { xs: 220, sm: 260, md: 600 },
                    borderRadius: 2,
                    bgcolor: "grey.100",
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={7} width={"100%"}>
              <Skeleton variant="text" height={40} width="60%" />
              <Skeleton variant="text" height={30} width="40%" sx={{ mt: 1 }} />
              <Skeleton
                variant="text"
                height={100}
                width="90%"
                sx={{ mt: 2 }}
              />
              <Box sx={{ mt: 3 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} height={30} width="80%" sx={{ my: 1 }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  }

  if (error && !offer) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="h5">{t("offer_not_found")}</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          {t("back")}
        </Button>
      </Container>
    );
  }

  if (!offer) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="h5">{t("offer_not_found")}</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          {t("back")}
        </Button>
      </Container>
    );
  }

  // Безопасный доступ к свойствам предложения
  const safeId = offer._id || id;
  const safeTitle = offer.title || "";
  const safeDescription = offer.description || "";
  const safePrice = offer.price || 0;
  const safeServiceType = offer.serviceType || "";
  const safeLocation = offer.location || "";
  const safeCreatedAt = offer.createdAt || "";

  // Получаем изображения
  const safeImages = Array.isArray(offer.images)
    ? offer.images.filter(Boolean)
    : [];

  if (safeImages.length === 0 && offer.image) {
    safeImages.push(offer.image);
  }
  if (safeImages.length === 0) {
    safeImages.push("https://placehold.co/600x400?text=Нет+изображения");
  }

  const safeProvider = offer.provider || {};
  // Определяем тип предложения, если есть поле type, используем его и приводим к правильному формату, иначе предполагаем ServiceOffer
  const offerType =
    offer.type === "offer"
      ? "Offer"
      : offer.type === "service_offer"
      ? "ServiceOffer"
      : offer.type || "ServiceOffer";

  return (
    <MotionContainer
      maxWidth="lg"
      sx={{ py: 4 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ maxWidth: 1260, mx: "auto" }}>
        {/* Верхняя навигация */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Stack direction="row" spacing={1}>
            <IconButton
              color={isFavorite ? "error" : "default"}
              onClick={handleFavoriteToggle}
              sx={{
                transition: "all 0.3s ease",
                "&:hover": { transform: "scale(1.1)" },
              }}
            >
              {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>

            {/* Кнопка редактирования для владельца или админа */}
            {offer &&
              (user?.role === "admin" ||
                offer?.providerId?._id === user?._id) && (
                <IconButton
                  color="primary"
                  onClick={() => setEditModalOpen(true)}
                  title={t("edit")}
                  sx={{
                    transition: "all 0.3s ease",
                    "&:hover": { transform: "scale(1.1)" },
                  }}
                >
                  <EditIcon />
                </IconButton>
              )}

            <IconButton
              onClick={(e) => setShareAnchorEl(e.currentTarget)}
              sx={{
                transition: "all 0.3s ease",
                "&:hover": { transform: "scale(1.1)" },
              }}
            >
              <ShareIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Сообщения об ошибке */}
        <AnimatePresence>
          {error && (
            <MotionBox
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              sx={{ mb: 2 }}
            >
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            </MotionBox>
          )}
        </AnimatePresence>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 2, md: 3 },
            position: "relative",
          }}
        >
          {/* Левая колонка с изображением */}
          <Box
            sx={{
              flex: { xs: "unset", md: "0 0 50%" },
              maxWidth: { xs: "100%", md: "50%" },
              mb: { xs: 2, md: 0 },
            }}
          >
            <MotionCard
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                position: { xs: "static", md: "sticky" },
                top: { md: 24 },
                width: "100%",
              }}
              elevation={1}
              whileHover={{ boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
            >
              <Swiper
                modules={[Navigation, Pagination, Zoom]}
                pagination={{ type: "fraction" }}
                navigation
                zoom
                spaceBetween={0}
                slidesPerView={1}
              >
                {safeImages.map((image, index) => (
                  <SwiperSlide key={`image-${index}`}>
                    <Box sx={{ position: "relative" }}>
                      <CardMedia
                        component="img"
                        image={image}
                        alt={`${safeTitle} - изображение ${index + 1}`}
                        sx={{
                          width: "100%",
                          height: { xs: 220, sm: 260, md: 600 },
                          objectFit: "cover",
                          backgroundColor: "grey.100",
                          cursor: "zoom-in",
                        }}
                        onClick={() => setFullscreenImage(image)}
                      />
                      <IconButton
                        sx={{
                          position: "absolute",
                          right: 8,
                          top: 8,
                          backgroundColor: "rgba(0,0,0,0.4)",
                          "&:hover": {
                            backgroundColor: "rgba(0,0,0,0.6)",
                          },
                        }}
                        onClick={() => setFullscreenImage(image)}
                      >
                        <ZoomInIcon sx={{ color: "white" }} />
                      </IconButton>
                    </Box>
                  </SwiperSlide>
                ))}
              </Swiper>
            </MotionCard>
          </Box>

          {/* Правая колонка с информацией */}
          <Box
            sx={{
              flex: { xs: "unset", md: "0 0 50%" },
              maxWidth: { xs: "100%", md: "50%" },
              width: "100%",
            }}
          >
            <MotionBox
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              sx={{ width: "100%" }}
            >
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                fontWeight="bold"
                sx={{ fontSize: { xs: 22, sm: 26, md: 32 } }}
              >
                {safeTitle}
              </Typography>

              <Typography
                variant="h5"
                color="primary"
                fontWeight="bold"
                sx={{ mb: 2, fontSize: { xs: 20, sm: 24, md: 28 } }}
              >
                {formatPrice(safePrice)}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Chip
                  icon={<CategoryIcon />}
                  label={t(safeServiceType)}
                  variant="outlined"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  icon={<RoomIcon />}
                  label={safeLocation}
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              </Box>

              <Typography variant="h6" gutterBottom>
                {t("description")}
              </Typography>

              <MotionPaper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 3,
                  backgroundColor: "background.default",
                  borderRadius: 2,
                  width: "100%",
                  color: theme.palette.text.primary,
                  transition: "background 0.2s, color 0.2s",
                }}
                whileHover={{
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[800]
                      : "#f7f9fc",
                  color: theme.palette.text.primary,
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
                  {safeDescription}
                </Typography>
              </MotionPaper>

              <Divider sx={{ mb: 3 }} />

              {/* Информация о поставщике услуг */}
              <Typography variant="h6" gutterBottom>
                {t("provider")}
              </Typography>

              <Box
                sx={{
                  width: "100%",
                  maxWidth: 400,
                  mx: "auto",
                  px: { xs: 1.5, sm: 0 },
                }}
              >
                <MotionCard
                  elevation={0}
                  sx={{
                    mb: 2,
                    borderRadius: { xs: 1, sm: 2 },
                    p: { xs: 1, sm: 2 },
                    boxShadow: { xs: "none", sm: 1 },
                  }}
                  whileHover={{ boxShadow: "0 4px 10px rgba(0,0,0,0.06)" }}
                >
                  <CardContent
                    sx={{
                      p: { xs: 0.5, sm: 2 },
                      "&:last-child": { pb: { xs: 0.5, sm: 2 } },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "center", sm: "flex-start" },
                        gap: { xs: 1, sm: 2 },
                      }}
                    >
                      <Avatar
                        src={safeProvider.avatar}
                        alt={safeProvider.name}
                        sx={{
                          width: { xs: 40, sm: 64 },
                          height: { xs: 40, sm: 64 },
                          mr: { xs: 0, sm: 2 },
                          mb: { xs: 0.5, sm: 0 },
                          border: 1,
                          borderColor: "primary.main",
                          fontSize: { xs: 20, sm: 32 },
                        }}
                      >
                        {safeProvider.name
                          ? safeProvider.name[0].toUpperCase()
                          : "P"}
                      </Avatar>
                      <Box sx={{ flex: 1, width: "100%" }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{
                              textAlign: { xs: "center", sm: "left" },
                              fontSize: { xs: 15, sm: 18 },
                              fontWeight: 500,
                            }}
                          >
                            {safeProvider.name}
                          </Typography>
                          {safeProvider._id && (
                            <Button
                              size="small"
                              variant="text"
                              onClick={handleProviderProfileClick}
                              sx={{
                                textTransform: "none",
                                fontSize: 13,
                                ml: 1,
                              }}
                            >
                              Профиль
                            </Button>
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            mb: 0.5,
                            justifyContent: { xs: "center", sm: "flex-start" },
                            fontSize: { xs: 12, sm: 14 },
                          }}
                        >
                          <EmailIcon fontSize="inherit" />
                          {safeProvider.email}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            mt: 0.5,
                            fontSize: { xs: 12, sm: 14 },
                            textAlign: { xs: "center", sm: "left" },
                          }}
                        >
                          {t("member_since", {
                            date: formatDate(safeProvider.createdAt),
                          })}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 1 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Paper
                            elevation={0}
                            variant="outlined"
                            sx={{
                              p: { xs: 0.5, sm: 1.5 },
                              textAlign: "center",
                              borderRadius: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              color="primary"
                              sx={{ fontSize: { xs: 15, sm: 18 } }}
                            >
                              {safeProvider.providerInfo?.completedOffers || 0}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Заказы
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper
                            elevation={0}
                            variant="outlined"
                            sx={{
                              p: { xs: 0.5, sm: 1.5 },
                              textAlign: "center",
                              borderRadius: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              color="primary"
                              sx={{ fontSize: { xs: 15, sm: 18 } }}
                            >
                              {safeProvider.providerInfo?.responseRate || 0}%
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Ответы
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        flexDirection: "row",
                        gap: 1.5,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {user &&
                        user._id !== safeProvider._id &&
                        user.role !== "admin" && (
                          <Tooltip title={t("chat") || "Чат"}>
                            <span>
                              <Badge
                                badgeContent={unreadMessages}
                                color="error"
                              >
                                <IconButton
                                  color="primary"
                                  onClick={handleContactProvider}
                                  sx={{
                                    bgcolor: "primary.light",
                                    color: "white",
                                    transition:
                                      "background 0.2s, box-shadow 0.2s",
                                    boxShadow: 1,
                                    "&:hover": {
                                      bgcolor: "primary.dark",
                                      boxShadow: 3,
                                    },
                                  }}
                                >
                                  <ChatIcon fontSize="small" />
                                </IconButton>
                              </Badge>
                            </span>
                          </Tooltip>
                        )}
                      {safeProvider.email && (
                        <Tooltip title={t("send_email") || "Email"}>
                          <span>
                            <IconButton
                              color="primary"
                              sx={{
                                bgcolor: "primary.light",
                                color: "white",
                                transition: "background 0.2s, box-shadow 0.2s",
                                boxShadow: 1,
                                "&:hover": {
                                  bgcolor: "primary.dark",
                                  boxShadow: 3,
                                },
                              }}
                              onClick={() =>
                                (window.location.href = `mailto:${safeProvider.email}`)
                              }
                            >
                              <EmailIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {safeProvider.phone && (
                        <Tooltip title={t("call_provider") || "Позвонить"}>
                          <span>
                            <IconButton
                              color="primary"
                              sx={{
                                bgcolor: "primary.light",
                                color: "white",
                                transition: "background 0.2s, box-shadow 0.2s",
                                boxShadow: 1,
                                "&:hover": {
                                  bgcolor: "primary.dark",
                                  boxShadow: 3,
                                },
                              }}
                              onClick={() =>
                                (window.location.href = `tel:${safeProvider.phone}`)
                              }
                            >
                              <CallIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Box>
                    {safeProvider._id && (
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          variant="text"
                          onClick={() =>
                            navigate(`/offers?providerId=${safeProvider._id}`)
                          }
                          sx={{ fontSize: 15, fontWeight: 500 }}
                        >
                          {t("view_all_provider_offers", {
                            defaultValue:
                              "Посмотреть все предложения провайдера",
                          })}
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </MotionCard>
              </Box>

              {/* Добавляем блок с отзывами */}
              <Box
                sx={{ mt: 3, mb: 2, display: "flex", justifyContent: "center" }}
              >
                {isAuthenticated &&
                  user?._id !== offer?.providerId?._id &&
                  user?.role !== "admin" && (
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                        fontSize: "1rem",
                        px: 4,
                      }}
                      onClick={() => setOrderModalOpen(true)}
                    >
                      {t("create_request")}
                    </Button>
                  )}
              </Box>
              <CreateOrderModal
                open={orderModalOpen}
                onClose={() => setOrderModalOpen(false)}
                offer={offer}
              />
              <Reviews
                offerId={id}
                offerType={offerType}
                showAddButton={true}
              />

              {/* Дополнительная информация */}
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: "background.default",
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center", mb: 1 }}
                >
                  <EventIcon fontSize="small" sx={{ mr: 1 }} />
                  {t("created_at")}: {formatDate(safeCreatedAt)}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <InfoIcon fontSize="small" sx={{ mr: 1 }} />
                  ID: {safeId}
                </Typography>
              </Paper>
            </MotionBox>
          </Box>
        </Box>
      </Box>

      {/* Fullscreen image dialog */}
      <Dialog
        fullScreen
        open={Boolean(fullscreenImage)}
        onClose={() => setFullscreenImage(null)}
      >
        <Box sx={{ position: "relative", height: "100%" }}>
          <IconButton
            sx={{
              position: "absolute",
              right: 16,
              top: 16,
              backgroundColor: "rgba(0,0,0,0.4)",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.6)",
              },
              zIndex: 1,
            }}
            onClick={() => setFullscreenImage(null)}
          >
            <CloseIcon sx={{ color: "white" }} />
          </IconButton>
          <Box
            component="img"
            src={fullscreenImage}
            alt="Fullscreen view"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "rgba(0,0,0,0.9)",
            }}
          />
        </Box>
      </Dialog>

      {/* Share menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={() => setShareAnchorEl(null)}
      >
        <MenuItem onClick={() => handleShare("facebook")}>
          <FacebookIcon sx={{ mr: 1 }} /> Facebook
        </MenuItem>
        <MenuItem onClick={() => handleShare("twitter")}>
          <TwitterIcon sx={{ mr: 1 }} /> Twitter
        </MenuItem>
        <MenuItem onClick={() => handleShare("linkedin")}>
          <LinkedInIcon sx={{ mr: 1 }} /> LinkedIn
        </MenuItem>
        <MenuItem onClick={() => handleShare("whatsapp")}>
          <WhatsAppIcon sx={{ mr: 1 }} /> WhatsApp
        </MenuItem>
        <MenuItem onClick={() => handleShare("copy")}>
          <ShareIcon sx={{ mr: 1 }} /> {t("copy_link")}
        </MenuItem>
      </Menu>

      <AuthRequiredModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={() => {
          setAuthModalOpen(false);
          navigate("/login");
        }}
        onRegister={() => {
          setAuthModalOpen(false);
          navigate("/register");
        }}
      />

      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            position: "sticky",
            top: 0,
            zIndex: 10,
            backgroundColor: (theme) => theme.palette.background.paper,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            minHeight: 64,
          }}
        >
          {t("edit_offer")}
          <IconButton
            aria-label="close"
            onClick={() => setEditModalOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <OfferForm
          mode="edit"
          offer={offer}
          onSuccess={(updatedOffer) => {
            setOffer(updatedOffer);
            setEditModalOpen(false);
          }}
          onCancel={() => setEditModalOpen(false)}
          headerOffset={72}
        />
      </Dialog>
    </MotionContainer>
  );
};

export default OfferDetails;
