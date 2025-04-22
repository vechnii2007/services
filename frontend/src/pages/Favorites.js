import React, { useEffect, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import OfferList from "../components/OfferList";
import OfferService from "../services/OfferService";
import { AuthContext } from "../context/AuthContext";

const Favorites = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [offers, setOffers] = useState([]);
  const [favorites, setFavorites] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Если аутентификация завершена и пользователь не авторизован
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    let isSubscribed = true;

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const favoritesData = await OfferService.getFavorites();

        if (!isSubscribed) return;

        const favoritesMap = favoritesData.reduce((acc, offer) => {
          if (offer._id) {
            acc[offer._id] = true;
          }
          return acc;
        }, {});

        setOffers(favoritesData);
        setFavorites(favoritesMap);

        if (favoritesData.length === 0) {
          setMessage(t("no_favorites"));
        } else {
          setMessage(t("favorites_loaded"));
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
        if (isSubscribed) {
          setMessage(t("error_loading_favorites"));
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    if (user) {
      fetchFavorites();
    }

    return () => {
      isSubscribed = false;
    };
  }, [t, user, authLoading, navigate]);

  const handleFavoritesUpdate = (newFavorites) => {
    setFavorites(newFavorites);
    setOffers((prev) => prev.filter((offer) => newFavorites[offer._id]));
  };

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

      <OfferList
        offers={offers}
        favorites={favorites}
        setFavorites={handleFavoritesUpdate}
        loading={loading}
      />
    </Box>
  );
};

export default Favorites;
