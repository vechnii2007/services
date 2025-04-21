import React, { useCallback, useEffect, useMemo } from "react";
import { Grid, Box, Pagination, Typography } from "@mui/material";
import PropTypes from "prop-types";
import OfferCard from "./OfferCard/index";
import OfferCardSkeleton from "./OfferCard/OfferCardSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import OfferService from "../services/OfferService";
import debounce from "lodash/debounce";

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
    });
  }, [safeOffers, safeFavorites, setFavorites]);

  // Кэш для результатов запросов
  const favoriteCache = useMemo(() => new Map(), []);

  const debouncedToggleFavorite = useMemo(
    () =>
      debounce(async (offerId, offerType) => {
        const cacheKey = `${offerId}-${offerType}`;

        // Проверяем кэш
        if (favoriteCache.has(cacheKey)) {
          const cachedResult = favoriteCache.get(cacheKey);
          if (Date.now() - cachedResult.timestamp < 5000) {
            // 5 секунд
            console.log("Using cached favorite result");
            return cachedResult.data;
          }
        }

        try {
          const response = await OfferService.toggleFavorite(
            offerId,
            offerType
          );

          // Сохраняем в кэш
          favoriteCache.set(cacheKey, {
            data: response,
            timestamp: Date.now(),
          });

          return response;
        } catch (error) {
          console.error("Error in debouncedToggleFavorite:", error);
          throw error;
        }
      }, 300),
    []
  );

  const handleFavoriteClick = useCallback(
    async (offerId, offerType) => {
      if (!offerId) {
        console.error("Missing required offerId for handleFavoriteClick");
        return;
      }

      const safeOfferId = String(offerId);
      const safeOfferType = offerType || "offer";

      try {
        const response = await debouncedToggleFavorite(
          safeOfferId,
          safeOfferType
        );

        if (response && typeof setFavorites === "function") {
          setFavorites((prev) => ({
            ...prev,
            [safeOfferId]: Boolean(response.isFavorite),
          }));
        }
      } catch (error) {
        console.error("Error in handleFavoriteClick:", error);
      }
    },
    [setFavorites, debouncedToggleFavorite]
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
        <Typography variant="body1">Нет доступных предложений</Typography>
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
};

OfferList.defaultProps = {
  offers: [],
  favorites: {},
  page: 1,
  totalPages: 1,
  loading: false,
  setFavorites: () => {},
  onPageChange: () => {},
};

export default OfferList;
