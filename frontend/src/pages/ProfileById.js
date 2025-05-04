import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Avatar,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Rating,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  CardActions,
  Link as MuiLink,
  Snackbar,
  Alert as MuiAlert,
} from "@mui/material";
import { UserService } from "../services/UserService";
import ChatIcon from "@mui/icons-material/Chat";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import StarIcon from "@mui/icons-material/Star";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LanguageIcon from "@mui/icons-material/Language";

const ProfileById = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [offers, setOffers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [userData, offersData, reviewsData] = await Promise.all([
          UserService.getById(id),
          UserService.getOffersByUserId(id),
          UserService.getReviewsByProviderId(id),
        ]);
        setUser(userData);
        setOffers(offersData.offers || []);
        setReviews(reviewsData.reviews || []);
        // Проверка избранного (можно доработать под свою логику)
        // setIsFavorite(userData.isFavorite || false); // Удаляем избранное
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Ошибка загрузки профиля"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleFavorite = async () => {
    try {
      if (isFavorite) {
        await UserService.removeFromFavorites(id);
        setIsFavorite(false);
        setSnackbar({
          open: true,
          message: "Удалено из избранного",
          severity: "info",
        });
      } else {
        await UserService.addToFavorites(id);
        setIsFavorite(true);
        setSnackbar({
          open: true,
          message: "Добавлено в избранное",
          severity: "success",
        });
      }
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Ошибка при изменении избранного",
        severity: "error",
      });
    }
  };

  const handleReport = async () => {
    try {
      await UserService.reportUser(id, reportMsg || "Жалоба с профиля");
      setSnackbar({
        open: true,
        message: "Жалоба отправлена",
        severity: "success",
      });
      setReportOpen(false);
      setReportMsg("");
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Ошибка при отправке жалобы",
        severity: "error",
      });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Загрузка профиля...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!user) return null;

  // Рейтинг и бейджи (пример)
  const avgRating = reviews.length
    ? (
        reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      ).toFixed(1)
    : null;
  const reviewsCount = reviews.length;
  const isVerified = user.isVerified || false;
  const isTopPerformer = user.isTopPerformer || false;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper sx={{ p: 4, borderRadius: 4, boxShadow: 2 }}>
        {/* Основная информация */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar sx={{ width: 72, height: 72, mr: 3, fontSize: 36 }}>
            {user.name ? user.name[0].toUpperCase() : "?"}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {user.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              {avgRating && (
                <Rating
                  value={Number(avgRating)}
                  precision={0.1}
                  readOnly
                  size="medium"
                  icon={<StarIcon fontSize="inherit" />}
                />
              )}
              <Typography variant="body2" color="text.secondary">
                {avgRating
                  ? `${avgRating} (${reviewsCount} отзывов)`
                  : "Нет отзывов"}
              </Typography>
              {isVerified && (
                <Chip
                  label="Проверенный"
                  color="success"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
              {isTopPerformer && (
                <Chip
                  label="ТОП-исполнитель"
                  color="primary"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </Box>
        </Box>
        {/* Контакты и чат */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          {user.email && (
            <Button startIcon={<EmailIcon />} href={`mailto:${user.email}`}>
              Email
            </Button>
          )}
          {user.phone && (
            <Button startIcon={<PhoneIcon />} href={`tel:${user.phone}`}>
              Телефон
            </Button>
          )}
          {user.website && (
            <Button
              startIcon={<LanguageIcon />}
              href={user.website}
              target="_blank"
            >
              Сайт
            </Button>
          )}
        </Box>
        {/* Описание, специализация, языки */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ mb: 2 }}>
          {user.providerInfo?.description && (
            <Typography variant="body1" sx={{ mb: 1 }}>
              {user.providerInfo.description}
            </Typography>
          )}
          {user.providerInfo?.specialization?.length > 0 && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <b>Специализация:</b>{" "}
              {user.providerInfo.specialization.join(", ")}
            </Typography>
          )}
          {user.providerInfo?.languages?.length > 0 && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <b>Языки:</b> {user.providerInfo.languages.join(", ")}
            </Typography>
          )}
        </Box>
        {/* Активные предложения */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Активные предложения
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {offers.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary">
                Нет активных предложений
              </Typography>
            </Grid>
          )}
          {offers.map((offer) => (
            <Grid item xs={12} sm={6} md={4} key={offer._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    {offer.images && offer.images[0] && (
                      <img
                        src={offer.images[0]}
                        alt={offer.title}
                        width={60}
                        height={40}
                        style={{ borderRadius: 8, marginRight: 12 }}
                      />
                    )}
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {offer.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {offer.description}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight={600}>
                    {offer.price} ₽
                  </Typography>
                </CardContent>
                <CardActions>
                  <MuiLink href={`/offers/${offer._id}`} underline="none">
                    <Button size="small">Подробнее</Button>
                  </MuiLink>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        {/* Статистика */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", gap: 4, mb: 2 }}>
          <Box>
            <Typography variant="h6" align="center">
              {user.providerInfo?.completedOffers ?? 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Выполнено заказов
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" align="center">
              {user.providerInfo?.responseRate ?? 0}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Процент отклика
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" align="center">
              {user.createdAt ? new Date(user.createdAt).getFullYear() : "-"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              На платформе с
            </Typography>
          </Box>
        </Box>
        {/* Портфолио/сертификаты (если есть) */}
        {user.portfolio && user.portfolio.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Портфолио и сертификаты
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {user.portfolio.map((item, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {item.title}
                      </Typography>
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          width={100}
                          style={{ borderRadius: 8, marginTop: 8 }}
                        />
                      )}
                      {item.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          {item.description}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
        {/* FAQ/частые вопросы (если есть) */}
        {user.faq && user.faq.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Часто задаваемые вопросы
            </Typography>
            <List>
              {user.faq.map((q, idx) => (
                <ListItem key={idx}>
                  <ListItemText primary={q.question} secondary={q.answer} />
                </ListItem>
              ))}
            </List>
          </>
        )}
        {/* Отзывы */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Отзывы клиентов
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {reviews.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary">Пока нет отзывов</Typography>
            </Grid>
          )}
          {reviews.map((review) => (
            <Grid item xs={12} sm={6} key={review._id || review.id}>
              <Paper sx={{ p: 2, borderRadius: 2, mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Avatar
                    sx={{ width: 32, height: 32, mr: 1 }}
                    src={review.userId?.avatar}
                  >
                    {review.userId?.name
                      ? review.userId.name[0].toUpperCase()
                      : "?"}
                  </Avatar>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ mr: 1 }}
                  >
                    {review.userId?.name || "Аноним"}
                  </Typography>
                  <Rating value={review.rating} readOnly size="small" />
                  {review.createdAt && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2">{review.comment}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
      {/* Snackbar для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
      {/* Простая форма жалобы */}
      {reportOpen && (
        <Paper
          sx={{
            p: 3,
            mt: 2,
            maxWidth: 400,
            mx: "auto",
            position: "relative",
            zIndex: 10,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Пожаловаться на пользователя
          </Typography>
          <textarea
            value={reportMsg}
            onChange={(e) => setReportMsg(e.target.value)}
            placeholder="Опишите причину жалобы..."
            style={{
              width: "100%",
              minHeight: 60,
              marginBottom: 12,
              borderRadius: 8,
              border: "1px solid #ccc",
              padding: 8,
            }}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" color="error" onClick={handleReport}>
              Отправить
            </Button>
            <Button variant="outlined" onClick={() => setReportOpen(false)}>
              Отмена
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default ProfileById;
