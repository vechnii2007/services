import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import TariffService from "../services/TariffService";
import PaymentDialog from "./PaymentDialog";
import { toast } from "react-hot-toast";

const UserTariffsTab = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tariffs, setTariffs] = useState([]);
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const fetchTariffs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TariffService.getSubscriptionTariffs();
      setTariffs(data.filter((tariff) => tariff.isActive));
    } catch (e) {
      console.error("Error fetching tariffs:", e);
      setError(e.response?.data?.message || t("error_loading_tariffs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTariffs();
  }, []);

  const handleSelectTariff = (tariff) => {
    setSelectedTariff(tariff);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = (payment) => {
    toast.success(t("payment_created"));
    setPaymentDialogOpen(false);
    // Здесь можно добавить обновление UI или перенаправление
  };

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

  if (tariffs.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="info">{t("no_tariffs")}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        {t("available_tariffs")}
      </Typography>

      <Grid container spacing={3} mt={2}>
        {tariffs.map((tariff) => (
          <Grid item xs={12} sm={6} md={4} key={tariff._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {tariff.name}
                </Typography>

                <Typography color="textSecondary" paragraph>
                  {tariff.description}
                </Typography>

                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography>{t("type")}:</Typography>
                    <Chip
                      label={t(tariff.type)}
                      color={
                        tariff.type === "subscription" ? "primary" : "default"
                      }
                    />
                  </Stack>

                  {tariff.type === "subscription" && (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography>{t("period")}:</Typography>
                      <Typography>
                        {t("days", { count: tariff.period })}
                      </Typography>
                    </Stack>
                  )}

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="h6">{t("price")}:</Typography>
                    <Typography variant="h6" color="primary">
                      {new Intl.NumberFormat("ru-RU", {
                        style: "currency",
                        currency: "EUR",
                      }).format(tariff.price)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>

              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => handleSelectTariff(tariff)}
                >
                  {t("select_tariff")}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        tariff={selectedTariff}
        onSuccess={handlePaymentSuccess}
      />
    </Box>
  );
};

export default UserTariffsTab;
