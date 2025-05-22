import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Alert, Grid } from "@mui/material";
import OfferCard from "../OfferCard";
import OfferService from "../../services/OfferService";
import { useTranslation } from "react-i18next";

const UserPromotedOffersTab = ({ userId }) => {
  const { t } = useTranslation();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await OfferService.getPromotedOffersByUser(userId);
        setOffers(Array.isArray(data?.offers) ? data.offers : []);
      } catch (e) {
        setError(t("error_loading_offers") || "Ошибка загрузки предложений");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchOffers();
  }, [userId, t]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!offers.length) {
    return (
      <Box p={3}>
        <Alert severity="info">
          {t("no_promoted_offers") || "Нет продвинутых предложений"}
        </Alert>
      </Box>
    );
  }

  const now = new Date();
  const promotedOffers = offers.filter(
    (offer) =>
      offer.promoted &&
      offer.promoted.isPromoted === true &&
      new Date(offer.promoted.promotedUntil) > now
  );

  if (!promotedOffers.length) {
    return (
      <Box p={3}>
        <Alert severity="info">
          {t("no_promoted_offers") || "Нет продвинутых предложений"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        {t("promoted_offers")}
      </Typography>
      <Grid container spacing={2}>
        {promotedOffers.map((offer) => (
          <Grid item xs={12} sm={6} md={4} key={offer._id}>
            <OfferCard offer={offer} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default UserPromotedOffersTab;
