import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Rating,
  Button,
  Card,
  CardContent,
  Avatar,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import StarIcon from "@mui/icons-material/Star";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import { formatDistance } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "../../context/AuthContext";
import ReviewService from "../../services/ReviewService";
import { formatImagePath } from "../../utils/formatters";

// Стилизованные компоненты
const ReviewCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  overflow: "visible",
  position: "relative",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    boxShadow: theme.shadows[4],
    transform: "translateY(-2px)",
  },
}));

const ReviewAuthor = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(1),
}));

const ReviewDate = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.75rem",
  marginLeft: "auto",
}));

const ReviewActions = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  marginTop: theme.spacing(1),
}));

const RatingSummary = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  display: "flex",
  alignItems: "center",
  justifyContent: "space-around",
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
}));

const BigRating = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  "& .MuiTypography-h3": {
    fontWeight: "bold",
    color: theme.palette.primary.main,
  },
}));

/**
 * Компонент для отображения и управления отзывами
 */
function Reviews({
  offerId,
  offerType = "ServiceOffer",
  providerId,
  showAddButton = true,
}) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ rating: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    comment: "",
  });

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      if (offerId) {
        data = await ReviewService.getReviewsByOffer(offerId);
      } else if (providerId) {
        data = await ReviewService.getReviewsByProvider(providerId);
      } else {
        throw new Error("Необходимо указать offerId или providerId");
      }
      setReviews(data.reviews || []);
      setStats(data.stats || { rating: 0, count: 0 });
    } catch (error) {
      console.error("Error loading reviews:", error);
      setError(t("error_loading_reviews"));
    } finally {
      setLoading(false);
    }
  }, [offerId, providerId, t]);

  useEffect(() => {
    loadReviews();
  }, [offerId, providerId, loadReviews]);

  // Открытие диалога для создания/редактирования отзыва
  const handleOpenDialog = (review = null) => {
    if (review) {
      // Режим редактирования
      setEditingReview(review);
      setReviewFormData({
        rating: review.rating,
        comment: review.comment || "",
      });
    } else {
      // Режим создания
      setEditingReview(null);
      setReviewFormData({
        rating: 5,
        comment: "",
      });
    }
    setOpenDialog(true);
  };

  // Закрытие диалога
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingReview(null);
    setReviewFormData({
      rating: 5,
      comment: "",
    });
  };

  // Изменение рейтинга
  const handleRatingChange = (event, newValue) => {
    setReviewFormData({
      ...reviewFormData,
      rating: newValue,
    });
  };

  // Изменение комментария
  const handleCommentChange = (event) => {
    setReviewFormData({
      ...reviewFormData,
      comment: event.target.value,
    });
  };

  // Сохранение отзыва
  const handleSaveReview = async () => {
    try {
      setLoading(true);

      if (editingReview) {
        // Обновление существующего отзыва
        await ReviewService.updateReview(editingReview._id, reviewFormData);
        setSuccess(t("review_updated"));
      } else {
        // Создание нового отзыва
        await ReviewService.createReview({
          offerId,
          offerType,
          ...reviewFormData,
        });
        setSuccess(t("review_added"));
      }

      // Обновляем список отзывов
      await loadReviews();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving review:", error);
      setError(error.response?.data?.error || t("error_saving_review"));
    } finally {
      setLoading(false);
    }
  };

  // Удаление отзыва
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm(t("confirm_delete_review"))) {
      return;
    }

    try {
      setLoading(true);
      await ReviewService.deleteReview(reviewId);
      setSuccess(t("review_deleted"));

      // Обновляем список отзывов
      await loadReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      setError(error.response?.data?.error || t("error_deleting_review"));
    } finally {
      setLoading(false);
    }
  };

  // Проверка, может ли пользователь редактировать отзыв
  const canEditReview = (review) => {
    return isAuthenticated && user && review.userId._id === user._id;
  };

  // Проверка, оставил ли текущий пользователь отзыв
  const hasUserReviewed = () => {
    return reviews.some((review) => review.userId._id === user?._id);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        {t("reviews")} ({stats.count})
      </Typography>

      {/* Сообщения об ошибках и успехе */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Сводка рейтингов */}
      <RatingSummary elevation={1}>
        <BigRating>
          <Typography variant="h3">{stats.rating.toFixed(1)}</Typography>
          <Rating
            value={stats.rating}
            precision={0.5}
            readOnly
            size="large"
            emptyIcon={<StarIcon fontSize="inherit" />}
          />
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            {t("reviews_count", { count: stats.count })}
          </Typography>
        </BigRating>
      </RatingSummary>

      {/* Кнопка добавления отзыва */}
      {showAddButton && isAuthenticated && !hasUserReviewed() && (
        <Button
          variant="contained"
          color="primary"
          sx={{ mb: 3 }}
          onClick={() => handleOpenDialog()}
        >
          {t("add_review")}
        </Button>
      )}

      {/* Список отзывов */}
      {loading && reviews.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : reviews.length === 0 ? (
        <Typography
          variant="body1"
          sx={{ my: 4, textAlign: "center", color: "text.secondary" }}
        >
          {t("no_reviews_yet")}
        </Typography>
      ) : (
        <Box sx={{ mt: 2 }}>
          {reviews.map((review) => (
            <ReviewCard key={review._id} elevation={1}>
              <CardContent>
                <ReviewAuthor>
                  <Avatar
                    src={formatImagePath(review.userId.avatar)}
                    alt={review.userId.name}
                    sx={{ mr: 1.5 }}
                  >
                    {review.userId.name
                      ? review.userId.name[0].toUpperCase()
                      : "U"}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {review.userId.name}
                    </Typography>
                    <Rating
                      value={review.rating}
                      readOnly
                      size="small"
                      precision={0.5}
                    />
                  </Box>
                  <ReviewDate>
                    {formatDistance(new Date(review.createdAt), new Date(), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </ReviewDate>
                </ReviewAuthor>

                <Typography
                  variant="body2"
                  sx={{ mt: 1, whiteSpace: "pre-line" }}
                >
                  {review.comment}
                </Typography>

                {canEditReview(review) && (
                  <ReviewActions>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(review)}
                      title={t("edit_review")}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteReview(review._id)}
                      title={t("delete_review")}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ReviewActions>
                )}
              </CardContent>
            </ReviewCard>
          ))}
        </Box>
      )}

      {/* Диалог создания/редактирования отзыва */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingReview ? t("edit_review") : t("add_review")}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1 }}>
            <Typography component="legend">{t("your_rating")}:</Typography>
            <Rating
              name="rating"
              value={reviewFormData.rating}
              onChange={handleRatingChange}
              precision={0.5}
              size="large"
            />

            <TextField
              label={t("review_comment")}
              multiline
              rows={4}
              value={reviewFormData.comment}
              onChange={handleCommentChange}
              fullWidth
              variant="outlined"
              placeholder={t("write_your_review")}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSaveReview}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t("save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

Reviews.propTypes = {
  offerId: PropTypes.string,
  offerType: PropTypes.oneOf(["Offer", "ServiceOffer"]),
  providerId: PropTypes.string,
  showAddButton: PropTypes.bool,
};

export default Reviews;
