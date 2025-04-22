import React, { useCallback, useEffect, useMemo } from "react";
import { Grid, Box, Pagination, Typography } from "@mui/material";
import PropTypes from "prop-types";
import OfferCard from "./OfferCard/index";
import OfferCardSkeleton from "./OfferCard/OfferCardSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import OfferService from "../services/OfferService";
import { useUser } from "../hooks/useUser";

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
  const { user } = useUser();

  // Проверяем, что favorites - объект
  const safeFavorites =
    favorites && typeof favorites === "object" ? favorites : {};

  // Мемоизируем обработанный список предложений
  const safeOffers = useMemo(() => {
    return Array.isArray(offers) ? offers : [];
  }, [offers]);

  useEffect(() => {
    console.log("Current user:", user);
    console.log("Offers with providerId:", safeOffers);
  }, [user, safeOffers]);

  const handleFavoriteClick = useCallback(
    async (offerId, offerType) => {
      if (!offerId) {
        console.error("Missing required offerId for handleFavoriteClick");
        return;
      }

      try {
        const response = await OfferService.toggleFavorite(offerId, offerType);
        console.log("Toggle favorite response:", response);

        if (response && typeof setFavorites === "function") {
          setFavorites((prev) => {
            const newFavorites = { ...prev };
            if (response.isFavorite) {
              newFavorites[offerId] = true;
            } else {
              delete newFavorites[offerId];
            }
            return newFavorites;
          });
        }
      } catch (error) {
        console.error("Error in handleFavoriteClick:", error);
      }
    },
    [setFavorites]
  );

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[...Array(6)].map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <OfferCardSkeleton />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <>
      <Box
        component={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <Grid container spacing={3}>
          {safeOffers.map((offer) => {
            const isOwner = user && offer.providerId === user.id;
            console.log(`Offer ${offer._id} ownership check:`, {
              userId: user?.id,
              providerId: offer.providerId,
              isOwner,
            });
            return (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={offer._id}
                component={motion.div}
                variants={itemVariants}
              >
                <OfferCard
                  offer={offer}
                  isFavorite={!!safeFavorites[offer._id]}
                  onFavoriteClick={handleFavoriteClick}
                  isOwner={isOwner}
                />
              </Grid>
            );
          })}
        </Grid>
      </Box>
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={onPageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </>
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
