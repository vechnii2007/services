import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Divider,
  Chip,
  Box,
  MenuItem,
  TextField,
} from "@mui/material";
import PaymentService from "../../services/PaymentService";

const PaymentDetailsDialog = ({ open, payment, onClose, onStatusUpdate }) => {
  const { t } = useTranslation();
  const [newStatus, setNewStatus] = React.useState("");

  React.useEffect(() => {
    if (payment) {
      setNewStatus(payment.status);
    }
  }, [payment]);

  if (!payment) return null;

  const handleStatusUpdate = async () => {
    await onStatusUpdate(payment._id, newStatus);
    onClose();
  };

  const renderDetailRow = (label, value) => (
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography color="textSecondary" sx={{ minWidth: 150 }}>
        {label}:
      </Typography>
      <Typography>{value}</Typography>
    </Stack>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("payment_details")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {renderDetailRow("ID", payment._id)}
          {renderDetailRow(
            t("user"),
            payment.userId?.name || payment.userId?.email
          )}
          {renderDetailRow(t("tariff"), payment.tariffId?.name)}
          {renderDetailRow(
            t("amount"),
            PaymentService.formatAmount(payment.amount)
          )}
          {renderDetailRow(t("type"), t(payment.type))}
          {renderDetailRow(
            t("date"),
            PaymentService.formatDate(payment.createdAt)
          )}

          <Divider />

          <Box>
            <Typography color="textSecondary" gutterBottom>
              {t("current_status")}:
            </Typography>
            <Chip
              label={t(payment.status)}
              color={PaymentService.getStatusColor(payment.status)}
            />
          </Box>

          <TextField
            select
            label={t("new_status")}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            fullWidth
          >
            <MenuItem value="pending">{t("pending")}</MenuItem>
            <MenuItem value="paid">{t("paid", "Оплачено")}</MenuItem>
            <MenuItem value="failed">{t("failed")}</MenuItem>
            <MenuItem value="refunded">{t("refunded")}</MenuItem>
          </TextField>

          {payment.type === "subscription" && payment.subscription && (
            <>
              <Divider />
              <Typography variant="subtitle1" gutterBottom>
                {t("subscription_details")}
              </Typography>
              {renderDetailRow(
                t("start_date"),
                PaymentService.formatDate(payment.subscription.startDate)
              )}
              {renderDetailRow(
                t("end_date"),
                PaymentService.formatDate(payment.subscription.endDate)
              )}
              {renderDetailRow(
                t("subscription_status"),
                t(payment.subscription.status)
              )}
              {renderDetailRow(
                t("auto_renew"),
                payment.subscription.autoRenew ? t("yes") : t("no")
              )}
            </>
          )}

          {payment.metadata && Object.keys(payment.metadata).length > 0 && (
            <>
              <Divider />
              <Typography variant="subtitle1" gutterBottom>
                {t("additional_info")}
              </Typography>
              {Object.entries(payment.metadata).map(([key, value]) =>
                renderDetailRow(key, JSON.stringify(value))
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("close")}</Button>
        {payment.status !== newStatus && (
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            color="primary"
          >
            {t("update_status")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDetailsDialog;
