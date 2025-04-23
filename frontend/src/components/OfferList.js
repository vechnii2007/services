import React, { useCallback, useEffect, useMemo } from "react";
import { Grid, Box, Pagination, Typography, Paper } from "@mui/material";
import PropTypes from "prop-types";
import OfferCard from "./OfferCard/index";
import OfferCardSkeleton from "./OfferCard/OfferCardSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import OfferService from "../services/OfferService";
import SearchIcon from "@mui/icons-material/Search";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const OfferList = ({
  offers = [],
  favorites = {},
  setFavorites,
  page = 1,
  totalPages = 1,
  onPageChange,
  loading = false,
  toggleFavorite,
  searchQuery = "",
}) => {
  // Проверяем, что favorites - объект
  const safeFavorites =
    favorites && typeof favorites === "object" ? favorites : {};

  // Мемоизируем обработанный список предложений
  const safeOffers = useMemo(() => {
    console.log("Recalculating safeOffers");
    return Array.isArray(offers) ? offers : [];
  }, [offers]);

  useEffect(() => {
    console.log("OfferList mounted/updated with:", {
      offersCount: safeOffers.length,
      favorites: safeFavorites,
      hasFavorites: !!safeFavorites,
      hasSetFavorites: typeof setFavorites === "function",
      hasToggleFavorite: typeof toggleFavorite === "function",
    });
  }, [safeOffers, safeFavorites, setFavorites, toggleFavorite]);

  const handleFavoriteClick = useCallback(
    async (offerId, offerType) => {
      // Если предоставлен внешний обработчик toggleFavorite, используем его
      if (typeof toggleFavorite === "function") {
        console.log("Using external toggleFavorite handler");
        return toggleFavorite(offerId, offerType);
      }

      // Иначе используем внутреннюю реализацию
      if (!offerId) {
        console.error("Missing required offerId for handleFavoriteClick");
        return;
      }

      const safeOfferId = String(offerId);
      // Преобразуем тип предложения к формату, ожидаемому сервером
      const safeOfferType =
        offerType === "offer"
          ? "Offer"
          : offerType === "service_offer"
          ? "ServiceOffer"
          : offerType || "Offer";

      console.log(
        `Toggling favorite for offer: ${safeOfferId}, current status:`,
        safeFavorites[safeOfferId] ? "favorite" : "not favorite"
      );

      try {
        // Вызываем напрямую, без debounce
        const response = await OfferService.toggleFavorite(
          safeOfferId,
          safeOfferType
        );

        if (response && typeof setFavorites === "function") {
          const newIsFavorite = Boolean(response.isFavorite);
          console.log(
            `Favorite toggle response for ${safeOfferId}:`,
            newIsFavorite ? "added to favorites" : "removed from favorites"
          );

          // Немедленно обновляем состояние
          setFavorites((prev) => {
            const updated = {
              ...prev,
              [safeOfferId]: newIsFavorite,
            };
            console.log("Updated favorites state:", updated);

            // После каждого изменения избранного обновляем полностью список избранного
            // Это гарантирует, что список всегда в актуальном состоянии
            // Можно также сделать это через Promise.all([OfferService.fetchFavorites()])
            OfferService.fetchFavorites()
              .then((freshFavorites) => {
                if (
                  JSON.stringify(freshFavorites) !== JSON.stringify(updated)
                ) {
                  console.log(
                    "Refreshed favorites from server:",
                    freshFavorites
                  );
                  setFavorites(freshFavorites);
                }
              })
              .catch((error) => {
                console.error("Error refreshing favorites:", error);
              });

            return updated;
          });
        }
      } catch (error) {
        console.error("Error in handleFavoriteClick:", error);
      }
    },
    [setFavorites, safeFavorites, toggleFavorite]
  );

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${index}`}>
              <OfferCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (safeOffers.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        {searchQuery ? (
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 2,
              textAlign: "center",
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            <SearchIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              По запросу "{searchQuery}" ничего не найдено
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Попробуйте изменить поисковый запрос или настройки фильтров
            </Typography>
          </Paper>
        ) : (
          <Typography variant="body1">Нет доступных предложений</Typography>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <AnimatePresence>
        <Grid
          container
          spacing={3}
          sx={{ mb: 4 }}
          component={motion.div}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {safeOffers.map((offer, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={offer?._id || `offer-${index}`}
              component={motion.div}
              variants={itemVariants}
              layout
            >
              <OfferCard
                offer={offer || {}}
                isFavorite={
                  offer && offer._id ? Boolean(safeFavorites[offer._id]) : false
                }
                onFavoriteClick={() => {
                  if (offer && offer._id) {
                    handleFavoriteClick(offer._id, offer.type || "offer");
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>
      </AnimatePresence>
      {totalPages > 1 && (
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          display="flex"
          justifyContent="center"
          mb={3}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={onPageChange}
            disabled={loading}
            color="primary"
            size="large"
            sx={{
              "& .MuiPaginationItem-root": {
                transition: "all 0.2s",
                "&:hover": {
                  transform: "scale(1.1)",
                },
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

OfferList.propTypes = {
  offers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      price: PropTypes.number,
      image: PropTypes.string,
      location: PropTypes.string,
      createdAt: PropTypes.string,
      type: PropTypes.string,
    })
  ),
  favorites: PropTypes.object,
  setFavorites: PropTypes.func,
  page: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func,
  loading: PropTypes.bool,
  toggleFavorite: PropTypes.func,
  searchQuery: PropTypes.string,
};

OfferList.defaultProps = {
  offers: [],
  favorites: {},
  page: 1,
  totalPages: 1,
  loading: false,
  setFavorites: () => {},
  onPageChange: () => {},
  toggleFavorite: () => {},
};

export default OfferList;
