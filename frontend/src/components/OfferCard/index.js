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
import CategoryIcon from "@mui/icons-material/Category";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useTranslation } from "react-i18next";
import OfferService from "../../services/OfferService";
import PromoteOfferModal from "../PromoteOfferModal";
import AuthRequiredModal from "../AuthRequiredModal";
import { useAuth } from "../../hooks/useAuth";
import OfferForm from "./OfferForm";
import EditIcon from "@mui/icons-material/Edit";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import CloseIcon from "@mui/icons-material/Close";

// Оборачиваем Card в motion компонент
const MotionCard = motion(Card);

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
  backgroundColor: theme.palette.error.main,
  color: theme.palette.common.white,
  padding: theme.spacing(0.5, 1.2),
  borderRadius: `0 ${theme.shape.borderRadius}px 0 ${theme.shape.borderRadius}px`,
  fontSize: "0.8rem",
  fontWeight: "800",
  zIndex: 5,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
  "&:before": {
    content: '""',
    position: "absolute",
    left: -10,
    top: 0,
    borderStyle: "solid",
    borderWidth: "0 10px 10px 0",
    borderColor: `transparent ${theme.palette.error.main} transparent transparent`,
  },
}));

// Фолбэк-компонент, который показывается вместо ошибки
const EmptyOfferCard = () => {
  return (
    <MotionCard
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
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
    const auth = useAuth();
    const [promoteModalOpen, setPromoteModalOpen] = useState(false);
    const [promotionStatus, setPromotionStatus] = useState(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Безопасный доступ к свойствам
    const safeOfferId = offer?._id || "";
    const safeOfferTitle = offer?.title || "";
    const safeOfferDescription = offer?.description || "";
    const safeOfferPrice = offer?.price || 0;
    const safeOfferPriceFrom = offer?.priceFrom || null;
    const safeOfferPriceTo = offer?.priceTo || null;
    const safeOfferIsPriceRange = offer?.isPriceRange || false;
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
      if (!auth.isAuthenticated) {
        setAuthModalOpen(true);
        return;
      }
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

    // Переход в профиль провайдера
    const handleProviderClick = (e) => {
      e.stopPropagation();
      if (safeProvider?._id) {
        navigate(`/profile/${safeProvider._id}`);
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
            y: -8,
            boxShadow: "0 12px 32px rgba(80,80,120,0.12)",
            scale: 1.025,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          layout
          transition={{
            opacity: { duration: 0.2 },
            layout: { duration: 0.2 },
            scale: { duration: 0.18 },
          }}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: "20px",
            boxShadow: "0 6px 24px rgba(80,80,120,0.10)",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? theme.palette.background.level2
                : theme.palette.background.paper,
            position: "relative",
            overflow: "hidden",
            p: 0.5,
            transition: (theme) =>
              theme.transitions.create(
                ["box-shadow", "transform", "background-color"],
                {
                  duration: theme.transitions.duration.shorter,
                }
              ),
          }}
          onClick={handleViewClick}
        >
          {(isPromoted || promotionStatus?.isPromoted) && (
            <PromotedBadge>
              <TrendingUpIcon fontSize="small" />
              TOP
            </PromotedBadge>
          )}

          {shouldShowPromoteButton && (
            <PromoteButton
              onClick={handlePromoteClick}
              className={promotionStatus?.isPromoted ? "promoted" : ""}
              title={t("offer.promote")}
            >
              <TrendingUpIcon />
            </PromoteButton>
          )}

          <OfferImage
            image={safeOfferImage}
            images={offer?.images}
            title={safeOfferTitle}
          />

          <CardContent
            sx={{
              p: 2.5,
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2.5,
              }}
            >
              <Chip
                icon={<CategoryIcon />}
                label={t(safeServiceType)}
                size="small"
                sx={{
                  backgroundColor: (theme) => theme.palette.grey[200],
                  color: (theme) => theme.palette.text.secondary,
                  fontWeight: "medium",
                  height: "24px",
                }}
              />
              {(isOwner || userRole === "admin") && (
                <IconButton
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditModalOpen(true);
                  }}
                  title={t("edit")}
                >
                  <EditIcon />
                </IconButton>
              )}
            </Box>

            <OfferInfo
              title={safeOfferTitle}
              description={safeOfferDescription}
              price={safeOfferPrice}
              priceFrom={safeOfferPriceFrom}
              priceTo={safeOfferPriceTo}
              isPriceRange={safeOfferIsPriceRange}
              location={safeOfferLocation}
              createdAt={safeOfferCreatedAt}
            />

            <ProviderInfo
              provider={safeProvider}
              rating={Number(offer.rating) || 0}
              reviewCount={Number(offer.reviewCount) || 0}
              onClick={handleProviderClick}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 2.5,
                pt: 1.5,
                borderTop: (theme) => `1.5px solid ${theme.palette.divider}`,
                gap: 1.5,
              }}
            >
              <IconButton
                onClick={handleViewClick}
                size="medium"
                sx={{ borderRadius: 2 }}
              >
                <VisibilityIcon />
              </IconButton>
              <Button
                variant="contained"
                size="large"
                color="primary"
                onClick={handleViewClick}
                sx={(theme) => ({
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: "1rem",
                  px: 3,
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 2px 12px 0 rgba(99,102,241,0.18), 0 1.5px 4px 0 rgba(0,0,0,0.32)"
                      : "0 2px 8px rgba(80,80,120,0.08)",
                  background:
                    theme.palette.mode === "dark"
                      ? theme.palette.primary.main
                      : undefined,
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.common.white
                      : undefined,
                  border:
                    theme.palette.mode === "dark"
                      ? "1.5px solid rgba(255,255,255,0.10)"
                      : undefined,
                  transition: "background 0.18s, box-shadow 0.18s",
                  "&:hover": {
                    background:
                      theme.palette.mode === "dark"
                        ? theme.palette.primary.light
                        : undefined,
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 0 0 3px rgba(99,102,241,0.18), 0 2px 12px 0 rgba(99,102,241,0.18)"
                        : undefined,
                  },
                })}
              >
                {t("detail_button")}
              </Button>
              <IconButton
                onClick={handleFavoriteClick}
                size="medium"
                sx={{ borderRadius: 2 }}
              >
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

        <AuthRequiredModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onLogin={() => {
            setAuthModalOpen(false);
            navigate("/login");
          }}
          onRegister={() => {
            setAuthModalOpen(false);
            navigate("/register");
          }}
        />

        <Dialog
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              m: 0,
              p: 2,
              position: "sticky",
              top: 0,
              zIndex: 10,
              backgroundColor: (theme) => theme.palette.background.paper,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              minHeight: 64,
            }}
          >
            {t("edit_offer")}
            <IconButton
              aria-label="close"
              onClick={() => setEditModalOpen(false)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <OfferForm
            mode="edit"
            offer={offer}
            onSuccess={(updatedOffer) => {
              setEditModalOpen(false);
              if (typeof onUpdate === "function") {
                onUpdate(updatedOffer);
              }
            }}
            onCancel={() => setEditModalOpen(false)}
            headerOffset={72}
          />
        </Dialog>
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
