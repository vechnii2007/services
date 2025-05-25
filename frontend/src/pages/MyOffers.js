import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Typography, Grid, CircularProgress } from "@mui/material";
import OfferCard from "../components/OfferCard";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import OfferService from "../services/OfferService";

const MyOffers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [promotionStatuses, setPromotionStatuses] = useState({});

  const fetchMyOffers = useCallback(async () => {
    if (!isAuthenticated || !user?._id) {
      return;
    }

    try {
      setLoading(true);
      const response = await OfferService.getMyOffers();
      setOffers(response);
      setMessage(t("offers_loaded"));
      const ids = (response || []).map((o) => o._id);
      if (ids.length > 0) {
        const statuses = await OfferService.batchPromotionStatuses(ids);
        setPromotionStatuses(statuses);
      } else {
        setPromotionStatuses({});
      }
    } catch (error) {
      setMessage(
        "Error: " + (error.response?.data?.error || t("something_went_wrong"))
      );
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?._id, navigate, t]);

  useEffect(() => {
    fetchMyOffers();
  }, [fetchMyOffers, isAuthenticated, user?._id]);

  const handleOfferUpdate = useCallback((updatedOffer) => {
    setOffers((prevOffers) =>
      prevOffers.map((offer) =>
        offer._id === updatedOffer._id ? updatedOffer : offer
      )
    );
  }, []);

  const handleOfferDelete = useCallback((offerId) => {
    setOffers((prevOffers) =>
      prevOffers.filter((offer) => offer._id !== offerId)
    );
  }, []);

  if (!isAuthenticated) {
    return <Typography>{t("please_login")}</Typography>;
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ paddingY: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t("my_offers")}
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

      {offers.length > 0 ? (
        <Grid container spacing={3}>
          {offers.map((offer) => {
            const isOwner = offer.providerId === user?._id;

            return (
              <Grid item xs={12} sm={6} md={4} key={offer._id}>
                <OfferCard
                  offer={offer}
                  onUpdate={handleOfferUpdate}
                  onDelete={handleOfferDelete}
                  isOwner={isOwner}
                  canPromote={isOwner && user?.role === "provider"}
                  userId={user?._id}
                  userRole={user?.role}
                  promotionStatus={promotionStatuses[offer._id]}
                />
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Typography variant="body1" align="center">
          {t("no_offers")}
        </Typography>
      )}
    </Box>
  );
};

export default React.memo(MyOffers);
