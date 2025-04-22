import React, { useState } from "react";
import { Button, IconButton, Tooltip, CircularProgress } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { usePromotions } from "../../hooks/usePromotions";

export const TopPromoteButton = ({ offerId, variant = "icon", onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { createPromotion } = usePromotions();

  const handlePromote = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      const result = await createPromotion(offerId, "TOP");
      if (result) {
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error promoting offer:", error);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <Tooltip title="Поднять в топ">
        <IconButton
          onClick={handlePromote}
          disabled={loading}
          size="small"
          color="primary"
          sx={{
            backgroundColor: "background.paper",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            "&:hover": {
              backgroundColor: "background.paper",
              transform: "scale(1.1)",
            },
          }}
        >
          {loading ? <CircularProgress size={20} /> : <ArrowUpwardIcon />}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handlePromote}
      disabled={loading}
      startIcon={loading ? <CircularProgress size={20} /> : <ArrowUpwardIcon />}
      sx={{
        borderRadius: 2,
        textTransform: "none",
      }}
    >
      Поднять в топ
    </Button>
  );
};
