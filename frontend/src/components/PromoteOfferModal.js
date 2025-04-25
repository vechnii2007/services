import React, { useState } from "react";
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
  const [promotionType, setPromotionType] = useState("DAY");
  const [loading, setLoading] = useState(false);

  const handlePromote = async () => {
    try {
      setLoading(true);
      console.log("Promoting offer:", { offerId, promotionType });
      await OfferService.promoteOffer(offerId, promotionType);
      toast.success(t("offer.promotion_success"));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error promoting offer:", error);
      toast.error(error.response?.data?.error || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("offer.promote_title")}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {t("offer.promote_description")}
        </Typography>

        <RadioGroup
          value={promotionType}
          onChange={(e) => setPromotionType(e.target.value)}
        >
          <PromotionOption
            className={promotionType === "DAY" ? "selected" : ""}
          >
            <FormControlLabel
              value="DAY"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="subtitle1">
                    {t("offer.promote_24h")}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {t("offer.promote_24h_description")}
                  </Typography>
                </Box>
              }
            />
          </PromotionOption>

          <PromotionOption
            className={promotionType === "WEEK" ? "selected" : ""}
          >
            <FormControlLabel
              value="WEEK"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="subtitle1">
                    {t("offer.promote_7d")}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {t("offer.promote_7d_description")}
                  </Typography>
                </Box>
              }
            />
          </PromotionOption>
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
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {t("offer.promote_button")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromoteOfferModal;
