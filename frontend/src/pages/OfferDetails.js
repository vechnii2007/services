// src/pages/OfferDetails.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../constants";
import { Typography, Box, Card, CardContent, Button } from "@mui/material";

const OfferDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const res = await axios.get(`/api/services/offers/${id}`);
        setOffer(res.data);
        setMessage(t("offer_loaded"));
      } catch (error) {
        setMessage(
          "Error: " + (error.response?.data?.error || t("something_went_wrong"))
        );
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [id, t]);

  if (loading) {
    return <Typography>{t("loading")}</Typography>;
  }

  if (!offer) {
    return <Typography>{t("offer_not_found")}</Typography>;
  }

  return (
    <Box sx={{ paddingY: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t("offer_details")}
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
      <Card>
        <CardContent>
          <Typography variant="body1">
            <strong>{t("type")}:</strong>{" "}
            {offer.type === "independent"
              ? t("independent_offer")
              : t("service_offer")}
          </Typography>
          <Typography variant="body1">
            <strong>{t("service_type")}:</strong> {t(offer.serviceType)}
          </Typography>
          <Typography variant="body1">
            <strong>{t("location")}:</strong> {offer.location}
          </Typography>
          <Typography variant="body1">
            <strong>{t("description")}:</strong> {offer.description}
          </Typography>
          <Typography variant="body1">
            <strong>{t("price")}:</strong> {offer.price}
          </Typography>
          <Typography variant="body1">
            <strong>{t("provider")}:</strong> {offer?.provider?.name}
          </Typography>
          {offer.requestId && (
            <Typography variant="body1">
              <strong>{t("request_id")}:</strong> {offer.requestId}
            </Typography>
          )}
          <Typography variant="body1">
            <strong>{t("created_at")}:</strong>{" "}
            {new Date(offer.createdAt).toLocaleString()}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/offers")}
            sx={{ marginTop: 2 }}
          >
            {t("back_to_offers")}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OfferDetails;
