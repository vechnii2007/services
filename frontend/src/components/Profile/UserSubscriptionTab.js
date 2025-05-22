import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Grid,
  Divider,
  Chip,
} from "@mui/material";
import { AccessTime, CheckCircle, Warning } from "@mui/icons-material";
import UserTariffsTab from "../UserTariffsTab";
import UserPaymentsTab from "../UserPaymentsTab";
import SubscriptionService from "../../services/SubscriptionService";

const UserSubscriptionTab = ({ userId }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("subscription");
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await SubscriptionService.getUserSubscription(userId);
        setSubscription(data);
      } catch (e) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchSubscription();
  }, [userId]);

  const renderSubscriptionStatus = () => {
    if (loading) {
      return <Alert severity="info">{t("loading")}</Alert>;
    }
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    if (
      !subscription ||
      !subscription.status ||
      subscription.status === "none"
    ) {
      return (
        <Alert
          icon={<AccessTime fontSize="inherit" />}
          severity="info"
          sx={{ mb: 3 }}
        >
          {t("no_active_subscription")}
        </Alert>
      );
    }
    if (subscription.status === "expired") {
      return (
        <Alert
          icon={<Warning fontSize="inherit" />}
          severity="warning"
          sx={{ mb: 3 }}
        >
          {t("subscription_expired")}
        </Alert>
      );
    }
    if (subscription.status === "active") {
      return (
        <Alert
          icon={<CheckCircle fontSize="inherit" />}
          severity="success"
          sx={{ mb: 3 }}
        >
          {t("subscription_active_until", {
            date: new Date(subscription.expiresAt).toLocaleDateString(),
          })}
        </Alert>
      );
    }
    return null;
  };

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t("my_subscription")}
        </Typography>
        {renderSubscriptionStatus()}
        {subscription &&
          subscription.status === "active" &&
          subscription.tariff && (
            <Box mt={2}>
              <Typography variant="subtitle1" gutterBottom>
                {t("current_tariff")}:
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <Typography variant="h6">
                    {subscription.tariff.name}
                  </Typography>
                </Grid>
                <Grid item>
                  <Chip
                    label={t(subscription.tariff.type)}
                    color="primary"
                    size="small"
                  />
                </Grid>
                <Grid item>
                  <Typography variant="body2" color="textSecondary">
                    {t("period")}:{" "}
                    {t("days", { count: subscription.tariff.period })}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
      </Paper>

      <Box mb={3}>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant={activeTab === "subscription" ? "contained" : "outlined"}
              onClick={() => setActiveTab("subscription")}
            >
              {t("available_tariffs")}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant={activeTab === "payments" ? "contained" : "outlined"}
              onClick={() => setActiveTab("payments")}
            >
              {t("payment_history")}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {activeTab === "subscription" ? (
        <UserTariffsTab />
      ) : (
        <UserPaymentsTab userId={userId} />
      )}
    </Box>
  );
};

export default UserSubscriptionTab;
