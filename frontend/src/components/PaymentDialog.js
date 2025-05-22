import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import PaymentService from "../services/PaymentService";
import PaymentGatewayService from "../services/PaymentGatewayService";
import StripeCheckoutButton from "./StripeCheckoutButton";

const PaymentDialog = ({ open, onClose, tariff, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("mock");
  const [gpayLoading, setGpayLoading] = useState(false);
  const [apayLoading, setApayLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Создаем платеж в нашей системе
      const payment = await PaymentService.create({
        amount: tariff.price,
        type: tariff.type,
        tariffId: tariff._id,
      });

      // 2. Инициируем оплату через платежный шлюз
      const paymentGatewayResponse = await PaymentGatewayService.initiate(
        payment
      );

      // 3. Перенаправляем на страницу оплаты или показываем форму
      if (paymentGatewayResponse.redirectUrl) {
        window.location.href = paymentGatewayResponse.redirectUrl;
      }

      onSuccess(payment);
    } catch (e) {
      console.error("Error processing payment:", e);
      setError(e.response?.data?.message || t("error_processing_payment"));
    } finally {
      setLoading(false);
    }
  };

  const handleMockSuccess = async () => {
    setLoading(true);
    setError(null);
    try {
      // Создаём платёж на сервере, как при реальной оплате
      const payment = await PaymentService.create({
        amount: tariff.price,
        type: tariff.type,
        tariffId: tariff._id,
        mock: true, // для отладки, если нужно отличать на бэке
      });
      console.log("Mock payment created:", payment);
      onSuccess(payment);
      onClose();
    } catch (e) {
      console.error("Mock payment error:", e);
      setError(e.response?.data?.message || t("error_processing_payment"));
    } finally {
      setLoading(false);
    }
  };

  const handleMockError = () => {
    setError(t("error_processing_payment"));
  };

  const handleGPay = () => {
    setGpayLoading(true);
    setTimeout(() => {
      setGpayLoading(false);
      setError("Google Pay: " + t("in_development", "В разработке"));
    }, 1000);
  };

  const handleAPay = () => {
    setApayLoading(true);
    setTimeout(() => {
      setApayLoading(false);
      setError("Apple Pay: " + t("in_development", "В разработке"));
    }, 1000);
  };

  if (!tariff) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("confirm_payment")}</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              {t("tariff")}
            </Typography>
            <Typography variant="h6">{tariff.name}</Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              {t("description")}
            </Typography>
            <Typography>{tariff.description}</Typography>
          </Box>

          {tariff.type === "subscription" && (
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                {t("period")}
              </Typography>
              <Typography>{t("days", { count: tariff.period })}</Typography>
            </Box>
          )}

          <Divider />

          <Box>
            <Typography variant="subtitle2" color="textSecondary">
              {t("total_amount")}
            </Typography>
            <Typography variant="h5" color="primary">
              {new Intl.NumberFormat("ru-RU", {
                style: "currency",
                currency: "EUR",
              }).format(tariff.price)}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography
              variant="subtitle2"
              color="textSecondary"
              sx={{ mb: 1 }}
            >
              {t("payment_method", "Способ оплаты")}
            </Typography>
            <ToggleButtonGroup
              value={paymentMethod}
              exclusive
              onChange={(_, value) => value && setPaymentMethod(value)}
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value="mock">Mock</ToggleButton>
              <ToggleButton value="gpay">Google Pay</ToggleButton>
              <ToggleButton value="apay">Apple Pay</ToggleButton>
            </ToggleButtonGroup>
            {paymentMethod === "mock" && (
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleMockSuccess}
                  disabled={loading}
                >
                  {t("success", "Успешно")}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleMockError}
                  disabled={loading}
                >
                  {t("fail", "Ошибка")}
                </Button>
              </Stack>
            )}
            {paymentMethod === "gpay" && (
              <StripeCheckoutButton
                amount={tariff.price}
                description={
                  tariff.name +
                  (tariff.description ? ": " + tariff.description : "")
                }
              />
            )}
            {paymentMethod === "apay" && (
              <StripeCheckoutButton
                amount={tariff.price}
                description={
                  tariff.name +
                  (tariff.description ? ": " + tariff.description : "")
                }
              />
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t("cancel")}
        </Button>
        {paymentMethod === "mock" && null}
        {paymentMethod === "gpay" && null}
        {paymentMethod === "apay" && null}
        {paymentMethod === "real" && (
          <Button
            variant="contained"
            color="primary"
            onClick={handlePayment}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {t("proceed_to_payment")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;
