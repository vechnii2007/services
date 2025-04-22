import React, { useState, useEffect } from "react";
import { Box, Chip, IconButton, Tooltip } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import HighlightIcon from "@mui/icons-material/Highlight";
import { usePromotions } from "../../hooks/usePromotions";

const promotionIcons = {
  TOP: <StarIcon />,
  HIGHLIGHT: <HighlightIcon />,
  URGENT: <WhatshotIcon />,
};

const promotionLabels = {
  TOP: "В топе",
  HIGHLIGHT: "Выделено",
  URGENT: "Срочно",
};

const promotionColors = {
  TOP: "primary",
  HIGHLIGHT: "secondary",
  URGENT: "error",
};

export const PromotionStatus = ({ offerId, isOwner, onPromote }) => {
  const [status, setStatus] = useState(null);
  const { getPromotionStatus, cancelPromotion } = usePromotions();

  useEffect(() => {
    loadStatus();
  }, [offerId]);

  const loadStatus = async () => {
    const data = await getPromotionStatus(offerId);
    if (data) {
      setStatus(data);
    }
  };

  const handleCancel = async (type) => {
    const result = await cancelPromotion(offerId, type);
    if (result) {
      await loadStatus();
    }
  };

  if (!status) return null;

  return (
    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
      {Object.entries(status).map(
        ([type, active]) =>
          active && (
            <Tooltip
              key={type}
              title={
                isOwner ? "Нажмите, чтобы отменить" : promotionLabels[type]
              }
            >
              <Chip
                icon={promotionIcons[type]}
                label={promotionLabels[type]}
                color={promotionColors[type]}
                size="small"
                onClick={isOwner ? () => handleCancel(type) : undefined}
                onDelete={isOwner ? () => handleCancel(type) : undefined}
              />
            </Tooltip>
          )
      )}
      {isOwner && (
        <Tooltip title="Продвинуть объявление">
          <IconButton size="small" onClick={onPromote}>
            <StarIcon />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};
