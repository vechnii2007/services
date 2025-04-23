// src/pages/OfferDetails.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../middleware/api";
import { useTranslation } from "react-i18next";
import {
  Typography,
  Box,
  Container,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Divider,
  Avatar,
  Chip,
  IconButton,
  Skeleton,
  Alert,
  Rating,
  CardMedia,
  Stack,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  EventAvailable as EventIcon,
  Category as CategoryIcon,
  Info as InfoIcon,
  Chat as ChatIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Call as CallIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { formatDate, formatPrice } from "../utils/formatters";

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
  const [success, setSuccess] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchOffer = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/services/offers/${id}`);
        if (isMounted) {
          setOffer(res.data);
          setSuccess(t("offer_loaded"));

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

  const handleFavoriteToggle = async () => {
    try {
      if (isFavorite) {
        await api.delete(`/services/favorites/${id}`);
        setIsFavorite(false);
        setSuccess(t("removed_from_favorites"));
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
        setSuccess(t("added_to_favorites"));
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.error || t("something_went_wrong"));
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleShareOffer = () => {
    const url = window.location.href;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setSuccess(t("link_copied"));
        setTimeout(() => setSuccess(""), 3000);
      })
      .catch((err) => {
        setError(t("error_copying_link"));
        setTimeout(() => setError(""), 3000);
      });
  };

  const handleContactProvider = () => {
    // Здесь может быть переход в чат с провайдером
    if (offer?.provider?._id) {
      navigate(`/chat/${offer.provider._id}`);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ maxWidth: 1260, mx: "auto" }}>
          <Skeleton variant="text" width="50%" height={60} />
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={5}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
            <Grid item xs={12} md={7}>
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
  const safeImage =
    offer.image || "https://placehold.co/600x400?text=Нет+изображения";
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
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            {t("back_to_offers")}
          </Button>

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

            <IconButton
              onClick={handleShareOffer}
              sx={{
                transition: "all 0.3s ease",
                "&:hover": { transform: "scale(1.1)" },
              }}
            >
              <ShareIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Сообщения об успехе/ошибке */}
        {success && (
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{ mb: 2 }}
          >
            <Alert severity="success" onClose={() => setSuccess("")}>
              {success}
            </Alert>
          </MotionBox>
        )}

        {error && (
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{ mb: 2 }}
          >
            <Alert severity="error" onClose={() => setError("")}>
              {error}
            </Alert>
          </MotionBox>
        )}

        <Grid container spacing={3}>
          {/* Левая колонка с изображением */}
          <Grid item xs={12} md={5}>
            <MotionCard
              sx={{ borderRadius: 2, overflow: "hidden" }}
              whileHover={{ boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
            >
              <CardMedia
                component="img"
                image={safeImage}
                alt={safeTitle}
                sx={{
                  height: 400,
                  objectFit: "cover",
                  backgroundColor: "grey.100",
                }}
              />
            </MotionCard>
          </Grid>

          {/* Правая колонка с информацией */}
          <Grid item xs={12} md={7}>
            <MotionBox
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                fontWeight="bold"
              >
                {safeTitle}
              </Typography>

              <Typography
                variant="h5"
                color="primary"
                fontWeight="bold"
                sx={{ mb: 2 }}
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
                  icon={<LocationIcon />}
                  label={safeLocation}
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
              </Box>

              <Typography variant="h6" gutterBottom>
                {t("description")}
              </Typography>

              <MotionPaper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  backgroundColor: "background.default",
                  borderRadius: 2,
                }}
                whileHover={{ backgroundColor: "#f7f9fc" }}
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

              <MotionCard
                sx={{ mb: 3, borderRadius: 2 }}
                whileHover={{ boxShadow: "0 8px 15px rgba(0,0,0,0.1)" }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      src={safeProvider.avatar}
                      alt={safeProvider.name}
                      sx={{
                        width: 64,
                        height: 64,
                        mr: 2,
                        border: 2,
                        borderColor: "primary.main",
                      }}
                    />
                    <Box>
                      <Typography variant="h6">{safeProvider.name}</Typography>
                      {safeProvider.rating && (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Rating
                            value={safeProvider.rating}
                            readOnly
                            precision={0.5}
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            (
                            {safeProvider.rating !== undefined &&
                            safeProvider.rating !== null
                              ? safeProvider.rating.toFixed(1)
                              : "0.0"}
                            )
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<ChatIcon />}
                      onClick={handleContactProvider}
                      sx={{ flex: 1 }}
                    >
                      {t("contact_provider")}
                    </Button>

                    {safeProvider.phone && (
                      <IconButton
                        color="primary"
                        sx={{ bgcolor: "primary.light", color: "white" }}
                      >
                        <CallIcon />
                      </IconButton>
                    )}

                    {safeProvider.email && (
                      <IconButton
                        color="primary"
                        sx={{ bgcolor: "primary.light", color: "white" }}
                      >
                        <EmailIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </MotionCard>

              {/* Дополнительная информация */}
              <Box
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
              </Box>
            </MotionBox>
          </Grid>
        </Grid>
      </Box>
    </MotionContainer>
  );
};

export default OfferDetails;
