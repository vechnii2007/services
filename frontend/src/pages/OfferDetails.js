// src/pages/OfferDetails.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../middleware/api";
import { useTranslation } from "react-i18next";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Avatar,
  Chip,
  Paper,
  CardMedia,
  ImageList,
  ImageListItem,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Star as StarIcon,
  LocationOn,
  Euro,
  Person,
  Event,
  Description,
  Category,
  Image as ImageIcon,
  Analytics,
} from "@mui/icons-material";
import { useUser } from "../hooks/useUser";
import { PromotionStats } from "../components/Promotions/PromotionStats";
import { PromotionStatus } from "../components/Promotions/PromotionStatus";
import { PromotionDialog } from "../components/Promotions/PromotionDialog";

const OfferDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [comment, setComment] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [offerRes, ratingsRes, userRatingRes] = await Promise.all([
          api.get(`/services/offers/${id}`),
          api.get(`/offers/${id}/ratings`),
          api.get(`/offers/${id}/ratings/me`).catch(() => null),
        ]);

        if (isMounted) {
          setOffer(offerRes.data);
          setRatings(ratingsRes.data.ratings || []);
          setAverageRating(ratingsRes.data.averageRating || 0);
          if (userRatingRes?.data) {
            setUserRating(userRatingRes.data);
            setRatingValue(userRatingRes.data.rating);
            setComment(userRatingRes.data.comment || "");
          }
          setMessage(t("offer_loaded"));
        }
      } catch (error) {
        if (isMounted) {
          setMessage(
            "Error: " +
              (error.response?.data?.error || t("something_went_wrong"))
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, t]);

  // Записываем просмотр объявления для аналитики
  useEffect(() => {
    // Запись просмотра только после загрузки объявления и только один раз
    if (offer && !loading) {
      const recordView = async () => {
        try {
          // Добавляем некоторые метаданные о просмотре
          const metadata = {
            source: "details_page",
            referrer: document.referrer,
            screen: `${window.innerWidth}x${window.innerHeight}`,
          };

          await api.post(`/api/analytics/offers/${id}/views`, { metadata });
          console.log("View recorded for analytics");
        } catch (error) {
          console.error("Error recording view:", error);
          // Не выводим ошибку пользователю, чтобы не портить UX
        }
      };

      recordView();
    }
  }, [offer, id, loading]);

  const handleRatingSubmit = async () => {
    try {
      await api.post(`/offers/${id}/ratings`, {
        rating: ratingValue,
        comment: comment,
      });

      // Обновляем данные после отправки рейтинга
      const [ratingsRes, userRatingRes] = await Promise.all([
        api.get(`/offers/${id}/ratings`),
        api.get(`/offers/${id}/ratings/me`),
      ]);

      setRatings(ratingsRes.data.ratings || []);
      setAverageRating(ratingsRes.data.averageRating || 0);
      setUserRating(userRatingRes.data);
      setIsRatingDialogOpen(false);
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || t("something_went_wrong"))
      );
    }
  };

  const handleRatingDelete = async () => {
    try {
      await api.delete(`/offers/${id}/ratings`);
      setUserRating(null);
      setRatingValue(0);
      setComment("");

      // Обновляем список рейтингов
      const ratingsRes = await api.get(`/offers/${id}/ratings`);
      setRatings(ratingsRes.data.ratings || []);
      setAverageRating(ratingsRes.data.averageRating || 0);
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || t("something_went_wrong"))
      );
    }
  };

  // Проверка, является ли текущий пользователь владельцем объявления
  const isOwner = user && offer && user.id === offer.providerId;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePromoteClick = () => {
    setPromotionDialogOpen(true);
  };

  const handlePromotionSuccess = async () => {
    // Обновляем данные объявления после успешного создания промоакции
    try {
      const offerRes = await api.get(`/services/offers/${id}`);
      setOffer(offerRes.data);
    } catch (error) {
      console.error("Error updating offer after promotion:", error);
    }
  };

  // Функция для записи контакта
  const recordContact = async (type) => {
    try {
      await api.post(`/api/analytics/offers/${id}/contacts`, {
        type,
        metadata: {
          source: "details_page",
        },
      });
      console.log(`Contact (${type}) recorded for analytics`);
    } catch (error) {
      console.error("Error recording contact:", error);
      // Не выводим ошибку пользователю
    }
  };

  const handlePhoneClick = () => {
    recordContact("phone");
    // Дополнительные действия при клике на телефон (если нужны)
  };

  const handleMessageClick = () => {
    recordContact("message");
    // Открытие чата или форма сообщения
  };

  if (loading) {
    return <Typography>{t("loading")}</Typography>;
  }

  if (!offer) {
    return <Typography>{t("offer_not_found")}</Typography>;
  }

  return (
    <Box sx={{ paddingY: 4, px: { xs: 2, md: 4 } }}>
      {message && (
        <Typography
          variant="body2"
          color="textSecondary"
          align="center"
          sx={{ marginBottom: 2 }}
        >
          {message}
        </Typography>
      )}

      <Grid container spacing={3}>
        {/* Основная информация */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
            {offer.images && offer.images.length > 0 ? (
              <Box sx={{ position: "relative", height: 400 }}>
                <ImageList
                  sx={{
                    width: "100%",
                    height: "100%",
                    m: 0,
                  }}
                  cols={offer.images.length === 1 ? 1 : 2}
                  rowHeight={offer.images.length === 1 ? 400 : 200}
                >
                  {offer.images.map((image, index) => (
                    <ImageListItem key={index}>
                      <img
                        src={image}
                        alt={`${t(offer.serviceType)} - ${index + 1}`}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Box>
            ) : (
              <Box
                sx={{
                  height: 300,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "action.hover",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <ImageIcon sx={{ fontSize: 100, color: "action.active" }} />
              </Box>
            )}

            <Box
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                p: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  gutterBottom
                  component="div"
                  sx={{ fontWeight: "bold" }}
                >
                  {t(offer.serviceType)}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LocationOn fontSize="small" />
                  <Typography variant="h6">{offer.location}</Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 1,
                }}
              >
                <Chip
                  label={`${offer.price} €`}
                  icon={<Euro />}
                  color="secondary"
                  sx={{
                    fontSize: "1.5rem",
                    height: "auto",
                    py: 1,
                    bgcolor: "secondary.main",
                    "& .MuiChip-label": { px: 2 },
                  }}
                />
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Rating
                    value={averageRating}
                    precision={0.5}
                    readOnly
                    size="large"
                  />
                  <Typography
                    variant="h6"
                    sx={{ color: "primary.contrastText" }}
                  >
                    ({averageRating.toFixed(1)})
                  </Typography>
                </Box>
              </Box>
            </Box>

            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Description color="primary" />
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {t("description")}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {offer.description}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Category color="primary" />
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        {t("type")}
                      </Typography>
                      <Typography variant="body1">
                        {offer.type === "independent"
                          ? t("independent_offer")
                          : t("service_offer")}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Person color="primary" />
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        {t("provider")}
                      </Typography>
                      <Typography variant="body1">
                        {offer?.provider?.name || t("anonymous")}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Event color="primary" />
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">
                        {t("created_at")}
                      </Typography>
                      <Typography variant="body1">
                        {new Date(offer.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {offer.requestId && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      {t("request_id")}: {offer.requestId}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Paper>

          {/* Только для владельца: Статистика и управление */}
          {isOwner && (
            <Box mt={3}>
              <Paper elevation={2} sx={{ borderRadius: 2 }}>
                <Box p={2}>
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="offer management tabs"
                  >
                    <Tab label="Отзывы" id="tab-0" />
                    <Tab
                      label="Статистика"
                      id="tab-1"
                      icon={<Analytics fontSize="small" />}
                      iconPosition="start"
                    />
                  </Tabs>
                </Box>

                <Divider />

                <Box
                  role="tabpanel"
                  hidden={activeTab !== 0}
                  id="tabpanel-0"
                  p={3}
                >
                  {/* Содержимое вкладки с отзывами */}
                  <Box my={2}>
                    <Typography variant="h6" gutterBottom>
                      {t("ratings_and_reviews")} ({ratings.length})
                    </Typography>
                    {ratings.length > 0 ? (
                      ratings.map((rating) => (
                        <Box
                          key={rating._id}
                          mb={2}
                          p={2}
                          bgcolor="background.default"
                          borderRadius={1}
                        >
                          <Box display="flex" alignItems="center" mb={1}>
                            <Avatar
                              src={rating.user?.avatar}
                              alt={`${rating.user?.firstName} ${rating.user?.lastName}`}
                              sx={{ width: 40, height: 40, mr: 2 }}
                            />
                            <Box>
                              <Typography variant="subtitle2">
                                {rating.user
                                  ? `${rating.user.firstName} ${rating.user.lastName}`
                                  : t("anonymous")}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {new Date(rating.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                          <Rating value={rating.rating} readOnly size="small" />
                          {rating.comment && (
                            <Typography variant="body2" mt={1}>
                              {rating.comment}
                            </Typography>
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography color="text.secondary">
                        {t("no_ratings_yet")}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-1">
                  {/* Содержимое вкладки со статистикой */}
                  <PromotionStats offerId={id} />
                </Box>
              </Paper>
            </Box>
          )}
        </Grid>

        {/* Боковая панель */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ borderRadius: 2, p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("contact_provider")}
            </Typography>

            <Box display="flex" alignItems="center" mb={3}>
              <Avatar
                src={offer.provider?.avatar}
                alt={offer.provider?.name || "Provider"}
                sx={{ width: 60, height: 60, mr: 2 }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {offer.provider?.name || t("anonymous_provider")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("member_since", {
                    date: new Date(
                      offer.provider?.createdAt || Date.now()
                    ).toLocaleDateString(),
                  })}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mb: 2 }}
              onClick={handlePhoneClick}
            >
              {t("call_provider")}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={handleMessageClick}
            >
              {t("message_provider")}
            </Button>
          </Paper>

          {/* Дополнительная информация */}
          <Paper elevation={3} sx={{ borderRadius: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("offer_details")}
            </Typography>

            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                {t("price")}
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {offer.price} ₽
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                {t("location")}
              </Typography>
              <Typography variant="body1">
                {offer.location || t("location_not_specified")}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                {t("category")}
              </Typography>
              <Typography variant="body1">
                {offer.category || t("category_not_specified")}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("published_on")}
              </Typography>
              <Typography variant="body1">
                {new Date(offer.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Paper>

          {/* Компонент для управления рекламными акциями */}
          {isOwner && (
            <>
              <Paper elevation={3} sx={{ borderRadius: 2, p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {t("promotions")}
                </Typography>

                <PromotionStatus offerId={id} />

                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handlePromoteClick}
                >
                  {t("promote_offer")}
                </Button>
              </Paper>

              {/* Статистика рекламных акций для владельца */}
              <Paper elevation={3} sx={{ borderRadius: 2, p: 3, mt: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <Analytics sx={{ mr: 1 }} />
                  {t("promotion_statistics")}
                </Typography>

                <PromotionStats offerId={id} />
              </Paper>
            </>
          )}
        </Grid>
      </Grid>

      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/offers")}
        sx={{ mt: 3 }}
        size="large"
      >
        {t("back_to_offers")}
      </Button>

      {/* Диалог добавления/редактирования рейтинга */}
      <Dialog
        open={isRatingDialogOpen}
        onClose={() => setIsRatingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            py: 2,
          }}
        >
          {userRating ? t("edit_rating") : t("add_rating")}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
            <Box>
              <Typography component="legend" gutterBottom>
                {t("your_rating")}:
              </Typography>
              <Rating
                value={ratingValue}
                onChange={(event, newValue) => {
                  setRatingValue(newValue);
                }}
                size="large"
              />
            </Box>
            <TextField
              label={t("comment")}
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              fullWidth
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setIsRatingDialogOpen(false)}
            variant="outlined"
            size="large"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleRatingSubmit}
            variant="contained"
            disabled={!ratingValue}
            size="large"
          >
            {t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог для создания рекламных акций */}
      <PromotionDialog
        open={promotionDialogOpen}
        onClose={() => setPromotionDialogOpen(false)}
        offerId={id}
        onSuccess={handlePromotionSuccess}
      />
    </Box>
  );
};

export default OfferDetails;
