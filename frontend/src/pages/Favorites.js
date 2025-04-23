import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import OfferList from "../components/OfferList";
import OfferService from "../services/OfferService";
import { toast } from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

const Favorites = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user, token } = useAuth();
  const [favorites, setFavorites] = useState({});
  const [favoriteOffers, setFavoriteOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Загрузка избранных предложений
  useEffect(() => {
    // Ждем, пока загрузится состояние авторизации
    if (authLoading) return;

    // Если пользователь не авторизован, не делаем запрос
    if (!isAuthenticated || !user || !token) {
      setLoading(false);
      setMessage(t("login_to_view_favorites"));
      return;
    }

    const fetchFavorites = async () => {
      try {
        setLoading(true);

        // Получаем данные из API
        const favoritesData = await OfferService.get("/favorites");
        setFavoriteOffers(favoritesData || []);

        // Создаем объект для передачи в OfferList в формате { id: true }
        const favoriteMap = {};
        favoritesData.forEach((offer) => {
          if (offer && offer._id) {
            favoriteMap[offer._id] = true;
          }
        });
        setFavorites(favoriteMap);

        if (!favoritesData || favoritesData.length === 0) {
          setMessage(t("no_favorites"));
        }
      } catch (error) {
        // Проверяем статус 401 для неавторизованных запросов
        if (error.response?.status === 401) {
          setMessage(t("login_to_view_favorites"));
        } else {
          setError(error.message || t("common.errorOccurred"));
        }
      } finally {
        setLoading(false);
      }
    };

    // Убедимся, что пользователь полностью авторизован перед загрузкой данных
    if (isAuthenticated && user && token) {
      fetchFavorites();
    }
  }, [t, isAuthenticated, authLoading, user, token, navigate]);

  // Обработчик удаления из избранного
  const toggleFavorite = useCallback(
    async (offerId, offerType) => {
      if (!isAuthenticated || !user || !token) {
        toast.error(t("offer.loginRequired"));
        return;
      }

      try {
        // Преобразуем тип предложения к формату, ожидаемому сервером
        const serverOfferType =
          offerType === "offer"
            ? "Offer"
            : offerType === "service_offer"
            ? "ServiceOffer"
            : offerType || "Offer";

        // Оптимистично обновляем UI
        const wasInFavorites = favorites[offerId];
        if (wasInFavorites) {
          // Только для страницы избранного: также удаляем из списка при удалении из избранного
          setFavoriteOffers((prev) =>
            prev.filter((offer) => offer._id !== offerId)
          );
        }

        // Отправляем запрос на сервер
        const result = await OfferService.toggleFavorite(
          offerId,
          serverOfferType
        );

        // Обновляем состояние избранного
        if (!result.isFavorite) {
          toast.success(t("removed_from_favorites"));
        }
      } catch (error) {
        toast.error(t("common.errorOccurred"));

        // В случае ошибки обновляем список избранного с сервера
        try {
          const favoritesData = await OfferService.get("/favorites");
          setFavoriteOffers(favoritesData || []);

          // Обновляем объект избранного
          const favoriteMap = {};
          favoritesData.forEach((offer) => {
            if (offer && offer._id) {
              favoriteMap[offer._id] = true;
            }
          });
          setFavorites(favoriteMap);
        } catch (err) {
          console.error("Ошибка при обновлении списка избранного");
        }
      }
    },
    [favorites, isAuthenticated, t, user, token]
  );

  // Обработчик перехода по страницам (в будущем можно добавить пагинацию)
  const handlePageChange = useCallback(() => {
    // Пока не реализовано
  }, []);

  // Мемоизируем пустой объект для единственной страницы
  const pagination = useMemo(
    () => ({
      page: 1,
      totalPages: 1,
    }),
    []
  );

  // Пока загружается информация об авторизации, показываем индикатор загрузки
  if (authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ paddingY: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("favorites")}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!isAuthenticated ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t("login_to_view_favorites")}
        </Alert>
      ) : (
        <>
          <OfferList
            offers={favoriteOffers}
            favorites={favorites}
            setFavorites={setFavorites}
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            loading={loading}
            toggleFavorite={toggleFavorite}
          />

          {message && favoriteOffers.length === 0 && !loading && (
            <Typography variant="body1" align="center" sx={{ mt: 4 }}>
              {message}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default Favorites;
