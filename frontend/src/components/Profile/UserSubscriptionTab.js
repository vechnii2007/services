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
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await SubscriptionService.getAllUserSubscriptions();
        setSubscriptions(data.subscriptions || []);
      } catch (e) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, [userId]);

  const renderSubscriptionStatus = () => {
    if (loading) {
      return <Alert severity="info">{t("loading")}</Alert>;
    }
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    if (subscriptions.length === 0) {
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
    return (
      <Box>
        {subscriptions.map((sub, idx) => (
          <Paper
            key={sub._id || idx}
            sx={{
              p: 2,
              mb: 2,
              background: sub.status === "active" ? "#e8f5e9" : undefined,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle1" gutterBottom>
                  {t("tariff")}: {sub.tariffId?.name || "-"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Chip
                  label={t(sub.status)}
                  color={
                    sub.status === "active"
                      ? "success"
                      : sub.status === "expired"
                      ? "warning"
                      : "default"
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="textSecondary">
                  {t("period")}:{" "}
                  {sub.tariffId?.period
                    ? t("days", { count: sub.tariffId.period })
                    : "-"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="textSecondary">
                  {t("expires_at")}:{" "}
                  {sub.endDate
                    ? new Date(sub.endDate).toLocaleDateString()
                    : "-"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Box>
    );
  };

  // Определяем, есть ли активная премиум-подписка
  const hasPremium = subscriptions.some(
    (sub) => sub.status === "active" && sub.tariffId?.type === "premium"
  );

  return (
    <Box p={3}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t("my_subscription")}
          {hasPremium && (
            <Chip label="Premium account" color="warning" sx={{ ml: 2 }} />
          )}
        </Typography>
        {renderSubscriptionStatus()}
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
