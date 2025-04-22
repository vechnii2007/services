import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  CircularProgress,
  Alert,
  LinearProgress,
  Paper,
  Button,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PhoneIcon from "@mui/icons-material/Phone";
import ChatIcon from "@mui/icons-material/Chat";
import api from "../../middleware/api";

/**
 * Компонент для отображения статистики эффективности промоакций
 * @param {Object} props
 * @param {string} props.offerId - ID объявления
 * @param {string} props.promotionId - ID промоакции (опционально)
 */
export const PromotionStats = ({ offerId, promotionId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsPeriod, setStatsPeriod] = useState("week"); // week, month, all

  useEffect(() => {
    if (promotionId) {
      loadPromotionStats();
    } else if (offerId) {
      loadOfferPromotions();
    }
  }, [promotionId, offerId, statsPeriod]);

  const loadPromotionStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(
        `/api/analytics/promotions/${promotionId}/stats`
      );
      setStats(response.data);
    } catch (error) {
      console.error("Error loading promotion stats:", error);
      setError("Не удалось загрузить статистику промоакции");
    } finally {
      setLoading(false);
    }
  };

  const loadOfferPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Получаем список промоакций для объявления
      const promotionsResponse = await api.get(
        `/api/promotions/offer/${offerId}`
      );

      if (promotionsResponse.data && promotionsResponse.data.length > 0) {
        // Получаем статистику по последней промоакции
        const latestPromotion = promotionsResponse.data[0]; // Предполагаем, что они отсортированы по дате
        const statsResponse = await api.get(
          `/api/analytics/promotions/${latestPromotion._id}/stats`
        );
        setStats(statsResponse.data);
      } else {
        setStats({ noPromotions: true });
      }
    } catch (error) {
      console.error("Error loading offer promotions:", error);
      setError("Не удалось загрузить статистику промоакций для объявления");
    } finally {
      setLoading(false);
    }
  };

  const formatChange = (value) => {
    if (value > 0) {
      return (
        <Box
          sx={{ display: "flex", alignItems: "center", color: "success.main" }}
        >
          <ArrowUpwardIcon fontSize="small" />
          <Typography variant="body2" sx={{ ml: 0.5 }}>
            +{value.toFixed(1)}%
          </Typography>
        </Box>
      );
    } else if (value < 0) {
      return (
        <Box
          sx={{ display: "flex", alignItems: "center", color: "error.main" }}
        >
          <ArrowDownwardIcon fontSize="small" />
          <Typography variant="body2" sx={{ ml: 0.5 }}>
            {value.toFixed(1)}%
          </Typography>
        </Box>
      );
    } else {
      return (
        <Typography variant="body2" color="text.secondary">
          Без изменений
        </Typography>
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats || stats.noPromotions) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Нет данных о промоакциях для этого объявления
      </Alert>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">Эффективность промоакции</Typography>
            <Box>
              <Button
                size="small"
                variant={statsPeriod === "week" ? "contained" : "outlined"}
                sx={{ mr: 1 }}
                onClick={() => setStatsPeriod("week")}
              >
                Неделя
              </Button>
              <Button
                size="small"
                variant={statsPeriod === "month" ? "contained" : "outlined"}
                sx={{ mr: 1 }}
                onClick={() => setStatsPeriod("month")}
              >
                Месяц
              </Button>
              <Button
                size="small"
                variant={statsPeriod === "all" ? "contained" : "outlined"}
                onClick={() => setStatsPeriod("all")}
              >
                Все время
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {stats.type === "TOP" && "Поднятие в топ"}
              {stats.type === "HIGHLIGHT" && "Выделение объявления"}
              {stats.type === "URGENT" && "Срочное объявление"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Начало: {new Date(stats.startDate).toLocaleDateString()}
              {stats.endDate &&
                ` - Окончание: ${new Date(stats.endDate).toLocaleDateString()}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Стоимость: {stats.price} ₽
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <VisibilityIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Просмотры</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {stats.stats.viewsDuringPromotion}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    До: {stats.stats.viewsBeforePromotion}
                  </Typography>
                  {formatChange(stats.stats.viewsIncrease)}
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, stats.stats.viewsIncrease)}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <PhoneIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Контакты</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {stats.stats.contactsDuringPromotion}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    До: {stats.stats.contactsBeforePromotion}
                  </Typography>
                  {formatChange(stats.stats.contactsIncrease)}
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, stats.stats.contactsIncrease)}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "background.default" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Конверсия</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {stats.stats.conversionDuring.toFixed(1)}%
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    До: {stats.stats.conversionBefore.toFixed(1)}%
                  </Typography>
                  {formatChange(stats.stats.conversionIncrease)}
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, stats.stats.conversionIncrease)}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
            <Paper
              elevation={0}
              sx={{ p: 2, bgcolor: "background.default", width: "100%" }}
            >
              <Typography variant="subtitle1" align="center">
                Окупаемость инвестиций (ROI)
              </Typography>
              <Typography
                variant="h3"
                align="center"
                sx={{
                  my: 1,
                  color: stats.roi > 100 ? "success.main" : "text.primary",
                }}
              >
                {stats.roi}%
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                {stats.roi > 200 ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUpIcon color="success" sx={{ mr: 0.5 }} />
                    Отличная окупаемость!
                  </Box>
                ) : stats.roi > 100 ? (
                  "Хорошая окупаемость инвестиций"
                ) : stats.roi > 50 ? (
                  "Средняя окупаемость инвестиций"
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingDownIcon color="error" sx={{ mr: 0.5 }} />
                    Низкая окупаемость
                  </Box>
                )}
              </Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
