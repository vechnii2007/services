import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import OfferService from "../services/OfferService";
import { toast } from "react-hot-toast";
import PaymentDialog from "./PaymentDialog";
import TariffService from "../services/TariffService";

const PromotionOption = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  "&.selected": {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.lighter,
  },
}));

const PromoteOfferModal = ({ open, onClose, offerId, onSuccess }) => {
  const { t } = useTranslation();
  const [promotionTariffs, setPromotionTariffs] = useState([]);
  const [selectedTariffId, setSelectedTariffId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    if (open) {
      TariffService.getPromotionTariffs().then((tariffs) => {
        setPromotionTariffs(tariffs);
        if (tariffs.length > 0) setSelectedTariffId(tariffs[0]._id);
      });
    }
  }, [open]);

  const handlePromote = () => {
    setPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      setLoading(true);
      await OfferService.promoteOffer(offerId, selectedTariffId);
      toast.success(t("offer.promotion_success"));
      onSuccess?.();
      setPaymentOpen(false);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const selectedTariff = promotionTariffs.find(
    (t) => t._id === selectedTariffId
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t("offer.promote_title")}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {t("offer.promote_description")}
          </Typography>

          <RadioGroup
            value={selectedTariffId || ""}
            onChange={(e) => setSelectedTariffId(e.target.value)}
          >
            {promotionTariffs.map((tariff) => (
              <PromotionOption
                key={tariff._id}
                className={selectedTariffId === tariff._id ? "selected" : ""}
              >
                <FormControlLabel
                  value={tariff._id}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="subtitle1">{tariff.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {tariff.description}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {new Intl.NumberFormat("ru-RU", {
                          style: "currency",
                          currency: "EUR",
                        }).format(tariff.price)}
                      </Typography>
                    </Box>
                  }
                />
              </PromotionOption>
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handlePromote}
            variant="contained"
            color="primary"
            disabled={loading || !selectedTariff}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {t("offer.promote_button")}
          </Button>
        </DialogActions>
      </Dialog>
      {selectedTariff && (
        <PaymentDialog
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          tariff={selectedTariff}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default PromoteOfferModal;
