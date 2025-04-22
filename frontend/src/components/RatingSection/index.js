import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Rating,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  Pagination,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import api from "../../middleware/api";
import { useUser } from "../../hooks/useUser";
import { formatDate } from "../../utils/formatters";

const RatingSection = ({ offerId }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [comment, setComment] = useState("");

  // Загрузка рейтингов
  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/offers/${offerId}/ratings`, {
        params: { page },
      });
      setRatings(response.data.ratings);
      setAverageRating(response.data.averageRating);
      setTotalRatings(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      setError("Ошибка при загрузке рейтингов");
      console.error("Error fetching ratings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка рейтинга текущего пользователя
  const fetchUserRating = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/offers/${offerId}/ratings/me`);
      if (response.data) {
        setUserRating(response.data);
        setNewRating(response.data.rating);
        setComment(response.data.comment || "");
      }
    } catch (error) {
      console.error("Error fetching user rating:", error);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [offerId, page]);

  useEffect(() => {
    fetchUserRating();
  }, [offerId, user]);

  const handleRatingSubmit = async () => {
    try {
      await api.post(`/offers/${offerId}/ratings`, {
        rating: newRating,
        comment,
      });
      setOpenDialog(false);
      fetchRatings();
      fetchUserRating();
    } catch (error) {
      setError("Ошибка при сохранении рейтинга");
      console.error("Error submitting rating:", error);
    }
  };

  const handleRatingDelete = async () => {
    try {
      await api.delete(`/offers/${offerId}/ratings`);
      setUserRating(null);
      setNewRating(0);
      setComment("");
      fetchRatings();
    } catch (error) {
      setError("Ошибка при удалении рейтинга");
      console.error("Error deleting rating:", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Box sx={{ mr: 2 }}>
          <Typography variant="h6" component="span">
            {averageRating.toFixed(1)}
          </Typography>
          <Rating value={averageRating} precision={0.1} readOnly />
          <Typography variant="body2" color="text.secondary">
            {totalRatings} {t("ratings")}
          </Typography>
        </Box>

        {user && (
          <Button
            variant="contained"
            onClick={() => setOpenDialog(true)}
            sx={{ ml: "auto" }}
          >
            {userRating ? t("edit_rating") : t("add_rating")}
          </Button>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {ratings.map((rating) => (
        <Box key={rating._id} sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Avatar src={rating.userId.avatar} sx={{ mr: 1 }}>
              {rating.userId.name[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2">{rating.userId.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(rating.createdAt)}
              </Typography>
            </Box>
            <Rating value={rating.rating} readOnly sx={{ ml: "auto" }} />
          </Box>
          {rating.comment && (
            <Typography variant="body2" sx={{ ml: 6 }}>
              {rating.comment}
            </Typography>
          )}
        </Box>
      ))}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
          />
        </Box>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {userRating ? t("edit_rating") : t("add_rating")}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography component="legend">{t("your_rating")}</Typography>
            <Rating
              value={newRating}
              onChange={(e, value) => setNewRating(value)}
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t("comment")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          {userRating && (
            <Button
              onClick={handleRatingDelete}
              color="error"
              sx={{ mr: "auto" }}
            >
              {t("delete")}
            </Button>
          )}
          <Button onClick={() => setOpenDialog(false)}>{t("cancel")}</Button>
          <Button onClick={handleRatingSubmit} variant="contained">
            {t("save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RatingSection;
