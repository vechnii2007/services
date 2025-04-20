import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { API_BASE_URL } from "../constants";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
} from "@mui/material";

const Favorites = () => {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage(t("please_login"));
          setLoading(false);
          return;
        }

        const res = await axios.get(`/api/services/favorites`);
        setFavorites(res.data);
        setMessage(t("favorites_loaded"));
      } catch (error) {
        setMessage(
          "Error: " + (error.response?.data?.error || t("something_went_wrong"))
        );
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [t]);

  if (loading) {
    return <Typography>{t("loading")}</Typography>;
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

      {favorites.length > 0 ? (
        <Grid container spacing={3}>
          {favorites.map((offer) => (
            <Grid item xs={12} sm={6} md={3} key={offer.id}>
              <Card>
                {offer.image && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={offer.image}
                    alt={offer.serviceType}
                  />
                )}
                <CardContent>
                  <Typography variant="h6">
                    {t(offer.serviceType).toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {offer.description}
                  </Typography>
                  <Typography variant="h6" sx={{ marginTop: 1 }}>
                    {offer.price} {t("currency")}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 1,
                    }}
                  >
                    <Typography variant="body2">{offer.location}</Typography>
                    <Typography variant="body2">
                      {t(offer.serviceType)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to={`/offers/${offer.id}`}
                    sx={{ marginTop: 2, width: "100%" }}
                  >
                    {t("view_offer")}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" align="center">
          {t("no_favorites")}
        </Typography>
      )}
    </Box>
  );
};

export default Favorites;
