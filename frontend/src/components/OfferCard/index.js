import React, { memo, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Box,
  IconButton,
  Button,
  Typography,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ROUTES } from "../../constants";
import PropTypes from "prop-types";
import OfferImage from "./OfferImage";
import OfferInfo from "./OfferInfo";
import ProviderInfo from "../ProviderInfo";
import { motion } from "framer-motion";
import { styled } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import CategoryIcon from "@mui/icons-material/Category";
import { formatPrice } from "../../utils/formatters";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import PromoteOfferModal from "../PromoteOfferModal";
import { useTranslation } from "react-i18next";
import OfferService from "../../services/OfferService";

// Оборачиваем Card в motion компонент
const MotionCard = motion(Card);

const StatusChip = styled(Chip)(({ theme, status }) => ({
  position: "absolute",
  top: 16,
  left: 16,
  zIndex: 1,
  backgroundColor:
    status === "active" ? theme.palette.success.main : theme.palette.grey[500],
  color: theme.palette.common.white,
  fontWeight: "bold",
  "& .MuiChip-icon": {
    color: theme.palette.common.white,
  },
}));

const PromoteButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: 16,
  right: 16,
  zIndex: 2,
  backgroundColor: theme.palette.background.paper,
  "&:hover": {
    backgroundColor: theme.palette.background.default,
  },
  "&.promoted": {
    color: theme.palette.success.main,
  },
}));

const PromotedBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  right: 0,
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
  padding: theme.spacing(0.5, 1),
  borderRadius: `0 ${theme.shape.borderRadius}px 0 ${theme.shape.borderRadius}px`,
  fontSize: "0.75rem",
  fontWeight: "bold",
  zIndex: 5,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

// Фолбэк-компонент, который показывается вместо ошибки
const EmptyOfferCard = () => {
  return (
    <MotionCard
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "275px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        backgroundColor: "background.paper",
      }}
    >
      <Box
        sx={{
          height: "160px",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" color="textSecondary">
          Изображение недоступно
        </Typography>
      </Box>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle1">Предложение недоступно</Typography>
        <Typography variant="body2" color="textSecondary">
          Информация о предложении отсутствует или недоступна
        </Typography>
      </CardContent>
    </MotionCard>
  );
};

const OfferCard = memo(
  ({
    offer = {},
    isFavorite = false,
    onFavoriteClick = () => {},
    isOwner = false,
    showPromoteButton = false,
    canPromote = false,
    userId,
    userRole,
    onUpdate,
  }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [promoteModalOpen, setPromoteModalOpen] = useState(false);
    const [promotionStatus, setPromotionStatus] = useState(null);

    // Безопасный доступ к свойствам
    const safeOfferId = offer?._id || "";
    const safeOfferType = offer?.type || "offer";
    const safeOfferTitle = offer?.title || "";
    const safeOfferDescription = offer?.description || "";
    const safeOfferPrice = offer?.price || 0;
    const safeOfferImage = offer?.image || "";
    const safeOfferLocation = offer?.location || "";
    const safeOfferCreatedAt = offer?.createdAt || "";
    const safeProvider = offer?.provider || {};
    const safeServiceType = offer?.serviceType || "Общее";

    // Используем проп canPromote вместо повторной проверки
    const shouldShowPromoteButton = canPromote;

    useEffect(() => {
      const checkPromotionStatus = async () => {
        try {
          console.log("Checking promotion status for offer:", {
            offerId: safeOfferId,
            shouldShowPromoteButton,
            canPromote,
            isOwner,
            userRole,
          });

          if (!safeOfferId) {
            return;
          }

          const status = await OfferService.getPromotionStatus(safeOfferId);
          setPromotionStatus(status);
        } catch (error) {
          // Устанавливаем статус в null при ошибке, но не блокируем отображение карточки
          setPromotionStatus(null);
        }
      };

      if (safeOfferId && shouldShowPromoteButton) {
        checkPromotionStatus();
      }
    }, [safeOfferId, shouldShowPromoteButton, canPromote, isOwner, userRole]);

    const handleCardClick = (e) => {
      if (!safeOfferId || e.target.closest("button")) {
        return;
      }
      navigate(ROUTES.OFFER_DETAILS.replace(":id", safeOfferId));
    };

    const handleViewClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!safeOfferId) return;
      navigate(ROUTES.OFFER_DETAILS.replace(":id", safeOfferId));
    };

    const handleFavoriteClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!safeOfferId) return;

      try {
        if (typeof onFavoriteClick === "function") {
          onFavoriteClick();
        } else {
          console.error("onFavoriteClick is not a function");
        }
      } catch (error) {
        console.error("Error in handleFavoriteClick:", error);
      }
    };

    const handlePromoteClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canPromote) {
        console.warn("Promote button clicked but canPromote is false");
        return;
      }
      setPromoteModalOpen(true);
    };

    const handlePromoteSuccess = async () => {
      const status = await OfferService.getPromotionStatus(safeOfferId);
      setPromotionStatus(status);
      if (onUpdate) {
        onUpdate({ ...offer, promotionStatus: status });
      }
    };

    // Добавляем промо-статус для отображения в карточке
    const isPromoted =
      promotionStatus?.isPromoted ||
      (offer?.promoted?.isPromoted &&
        new Date(offer.promoted.promotedUntil) > new Date());

    // Если нет ID, показываем пустую карточку
    if (!safeOfferId) {
      console.warn("OfferCard received offer without ID:", offer);
      return <EmptyOfferCard />;
    }

    return (
      <>
        <MotionCard
          whileHover={{
            y: -5,
            boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          layout
          transition={{
            opacity: { duration: 0.2 },
            layout: { duration: 0.2 },
          }}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: "275px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            backgroundColor: "background.paper",
            position: "relative",
            overflow: "hidden",
          }}
          onClick={handleViewClick}
        >
          {isPromoted && (
            <PromotedBadge>
              <TrendingUpIcon fontSize="small" />
              TOP
            </PromotedBadge>
          )}

          <StatusChip
            icon={
              offer.status === "active" ? (
                <CheckCircleIcon />
              ) : (
                <PauseCircleIcon />
              )
            }
            label={t(`offer.status.${offer.status || "inactive"}`)}
            status={offer.status}
          />

          {shouldShowPromoteButton && (
            <PromoteButton
              onClick={handlePromoteClick}
              className={promotionStatus?.isPromoted ? "promoted" : ""}
              title={t("offer.promote")}
            >
              <TrendingUpIcon />
            </PromoteButton>
          )}

          {promotionStatus?.isPromoted && (
            <PromotedBadge>{t("offer.promoted")}</PromotedBadge>
          )}

          <OfferImage
            image={safeOfferImage}
            images={offer?.images}
            title={safeOfferTitle}
          />

          <CardContent sx={{ p: 2, flexGrow: 1 }}>
            <Box sx={{ mb: 1 }}>
              <Chip
                icon={<CategoryIcon />}
                label={t(safeServiceType)}
                size="small"
                sx={{
                  backgroundColor: (theme) => theme.palette.grey[200],
                  color: (theme) => theme.palette.text.secondary,
                  fontWeight: "medium",
                }}
              />
            </Box>

            <OfferInfo
              title={safeOfferTitle}
              description={safeOfferDescription}
              price={safeOfferPrice}
              location={safeOfferLocation}
              createdAt={safeOfferCreatedAt}
            />

            <ProviderInfo provider={safeProvider} />

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
            >
              <IconButton onClick={handleViewClick} size="small">
                <VisibilityIcon />
              </IconButton>
              <Button
                variant="contained"
                size="small"
                color="primary"
                onClick={handleViewClick}
              >
                {t("view")}
              </Button>
              <IconButton onClick={handleFavoriteClick} size="small">
                {isFavorite ? (
                  <FavoriteIcon color="error" />
                ) : (
                  <FavoriteBorderIcon />
                )}
              </IconButton>
            </Box>
          </CardContent>
        </MotionCard>

        <PromoteOfferModal
          open={promoteModalOpen}
          onClose={() => setPromoteModalOpen(false)}
          offerId={safeOfferId}
          onSuccess={handlePromoteSuccess}
        />
      </>
    );
  }
);

OfferCard.propTypes = {
  offer: PropTypes.object.isRequired,
  isFavorite: PropTypes.bool,
  onFavoriteClick: PropTypes.func,
  isOwner: PropTypes.bool,
  showPromoteButton: PropTypes.bool,
  canPromote: PropTypes.bool,
  userId: PropTypes.string,
  userRole: PropTypes.string,
  onUpdate: PropTypes.func,
};

export default OfferCard;
