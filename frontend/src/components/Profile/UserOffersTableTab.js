import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Button,
  CircularProgress,
  Box,
  Typography,
  Tooltip,
  TableRow,
  TableCell,
  useMediaQuery,
  Stack,
  Paper,
  Chip,
  IconButton,
  Grid,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import OfferService from "../../services/OfferService";
import GenericTable from "../AdminPanel/GenericTable";
import { useTheme } from "@mui/material/styles";
import PromoteOfferModal from "../PromoteOfferModal";
import DeleteIcon from "@mui/icons-material/Delete";

const UserOffersTableTab = ({ userId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [promoteModal, setPromoteModal] = useState({
    open: false,
    offerId: null,
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [demoteLoading, setDemoteLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const fetchMyOffers = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await OfferService.getMyOffers();
      setOffers(response);
    } catch (error) {
      setMessage(
        t("error_loading_offers") +
          ": " +
          (error.response?.data?.error || t("something_went_wrong"))
      );
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, t]);

  useEffect(() => {
    fetchMyOffers();
  }, [fetchMyOffers]);

  // Считаем количество активных топ-офферов
  const now = new Date();
  const topLimit = 1; // TODO: если лимит приходит с бэка — брать из offers/профиля/ролей
  const activeTopOffers = offers.filter(
    (o) =>
      o.promoted &&
      o.promoted.isPromoted &&
      new Date(o.promoted.promotedUntil) > now
  ).length;

  // --- Desktop Table ---
  const headers = [
    t("title"),
    t("category"),
    t("price"),
    t("location"),
    t("created_at"),
    t("status"),
    t("actions"),
  ];

  const renderRow = (offer) => {
    const isTop =
      offer.promoted && offer.promoted.isPromoted && offer.status === "active";
    const isActive = offer.status === "active";
    return (
      <TableRow
        key={offer._id}
        hover
        sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
        onClick={(e) => {
          if (e.target.closest(".offer-action-cell")) return;
          navigate(`/offers/${offer._id}`);
        }}
      >
        <TableCell sx={{ fontWeight: 500 }}>
          {offer.title || offer._id}
        </TableCell>
        <TableCell>{t(offer.category) || "-"}</TableCell>
        <TableCell>{offer.price ? `${offer.price} €` : "-"}</TableCell>
        <TableCell>{offer.location || "-"}</TableCell>
        <TableCell>
          {offer.createdAt
            ? new Date(offer.createdAt).toLocaleDateString()
            : "-"}
        </TableCell>
        <TableCell>
          <Chip
            label={t(offer.status)}
            color={
              offer.status === "active"
                ? "success"
                : offer.status === "pending"
                ? "warning"
                : offer.status === "rejected"
                ? "error"
                : "default"
            }
            size="small"
            sx={{ mr: isTop ? 1.5 : 0 }}
          />
          {isTop && (
            <Tooltip title={t("top") || "ТОП"}>
              <TrendingUpIcon
                sx={{ color: "#FFD600", verticalAlign: "middle", ml: 0.5 }}
              />
            </Tooltip>
          )}
        </TableCell>
        <TableCell
          className="offer-action-cell"
          align="center"
          sx={{ minWidth: 160, p: 0, textAlign: "center" }}
        >
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            spacing={0}
            columns={3}
            sx={{ width: 120, mx: "auto" }}
          >
            <Grid
              item
              xs={1}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              {isActive && (!offer.promoted || !offer.promoted.isPromoted) ? (
                <Tooltip
                  title={
                    activeTopOffers >= topLimit
                      ? t("limit_exceeded_top_offers")
                      : t("promote_to_top")
                  }
                >
                  <span>
                    <IconButton
                      color="primary"
                      size="medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPromoteModal({ open: true, offerId: offer._id });
                      }}
                      disabled={activeTopOffers >= topLimit}
                    >
                      <TrendingUpIcon fontSize="24" />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : null}
            </Grid>
            <Grid
              item
              xs={1}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              {isActive && offer.promoted && offer.promoted.isPromoted ? (
                <Tooltip title={t("remove_from_top") || "Убрать из ТОП"}>
                  <span>
                    <IconButton
                      color="warning"
                      size="medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromTop(offer._id);
                      }}
                      disabled={demoteLoading === offer._id}
                    >
                      {demoteLoading === offer._id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <TrendingDownIcon fontSize="24" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              ) : null}
            </Grid>
            <Grid
              item
              xs={1}
              sx={{ display: "flex", justifyContent: "center", ml: "auto" }}
            >
              <Tooltip title={t("delete_offer") || "Удалить предложение"}>
                <IconButton
                  color="error"
                  size="medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteOffer(offer._id);
                  }}
                  disabled={deleteLoading === offer._id}
                >
                  {deleteLoading === offer._id ? (
                    <CircularProgress size={20} />
                  ) : (
                    <DeleteIcon fontSize="24" />
                  )}
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </TableCell>
      </TableRow>
    );
  };

  // --- Mobile Card ---
  const renderMobileCard = (offer) => {
    const isTop =
      offer.promoted && offer.promoted.isPromoted && offer.status === "active";
    const isActive = offer.status === "active";
    return (
      <Paper
        key={offer._id}
        elevation={2}
        sx={{
          mb: 2,
          p: 2,
          borderRadius: "15px",
          cursor: "pointer",
          position: "relative",
          width: "100%",
          boxSizing: "border-box",
          mx: "auto",
          maxWidth: "100%",
        }}
        onClick={(e) => {
          if (e.target.closest(".offer-action-cell")) return;
          navigate(`/offers/${offer._id}`);
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {offer.title || offer._id}
          </Typography>
          <Box
            className="offer-action-cell"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              justifyContent: "center",
              width: "100%",
              height: "100%",
              textAlign: "center",
            }}
          >
            <Grid
              container
              justifyContent="center"
              alignItems="center"
              spacing={0}
              columns={3}
              sx={{ width: 120, mx: "auto" }}
            >
              <Grid
                item
                xs={1}
                sx={{ display: "flex", justifyContent: "center" }}
              >
                {isActive && (!offer.promoted || !offer.promoted.isPromoted) ? (
                  <Tooltip
                    title={
                      activeTopOffers >= topLimit
                        ? t("limit_exceeded_top_offers")
                        : t("promote_to_top")
                    }
                  >
                    <span>
                      <IconButton
                        color="primary"
                        size="medium"
                        disabled={activeTopOffers >= topLimit}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPromoteModal({ open: true, offerId: offer._id });
                        }}
                      >
                        <TrendingUpIcon fontSize="24" />
                      </IconButton>
                    </span>
                  </Tooltip>
                ) : null}
              </Grid>
              <Grid
                item
                xs={1}
                sx={{ display: "flex", justifyContent: "center" }}
              >
                {isActive && offer.promoted && offer.promoted.isPromoted ? (
                  <Tooltip title={t("remove_from_top") || "Убрать из ТОП"}>
                    <IconButton
                      color="warning"
                      size="medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromTop(offer._id);
                      }}
                      disabled={demoteLoading === offer._id}
                    >
                      {demoteLoading === offer._id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <TrendingDownIcon fontSize="24" />
                      )}
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Grid>
              <Grid
                item
                xs={1}
                sx={{ display: "flex", justifyContent: "center" }}
              >
                <Tooltip title={t("delete_offer") || "Удалить предложение"}>
                  <IconButton
                    color="error"
                    size="medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteOffer(offer._id);
                    }}
                    disabled={deleteLoading === offer._id}
                  >
                    {deleteLoading === offer._id ? (
                      <CircularProgress size={20} />
                    ) : (
                      <DeleteIcon fontSize="24" />
                    )}
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>
        </Stack>
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t("category")}: {t(offer.category) || "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("price")}: {offer.price ? `${offer.price} €` : "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("location")}: {offer.location || "-"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("created_at")}:{" "}
            {offer.createdAt
              ? new Date(offer.createdAt).toLocaleDateString()
              : "-"}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={t(offer.status)}
              color={
                offer.status === "accepted"
                  ? "success"
                  : offer.status === "pending"
                  ? "warning"
                  : offer.status === "rejected"
                  ? "error"
                  : "default"
              }
              size="small"
            />
          </Box>
        </Stack>
      </Paper>
    );
  };

  const handleRemoveFromTop = async (offerId) => {
    setDemoteLoading(offerId);
    try {
      await OfferService.removePromotion(offerId);
      fetchMyOffers();
    } catch (e) {
      setMessage(t("error_promoting_offer") || "Ошибка при снятии продвижения");
    } finally {
      setDemoteLoading(null);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (
      !window.confirm(
        t("confirm_delete_offer") ||
          "Вы уверены, что хотите удалить это предложение?"
      )
    )
      return;
    setDeleteLoading(offerId);
    setMessage("");
    try {
      console.log("[Удаление оффера] id:", offerId);
      const result = await OfferService.deleteOffer(offerId);
      console.log("[Удаление оффера] результат:", result);
      fetchMyOffers();
      setMessage(t("offer_deleted") || "Предложение удалено");
    } catch (e) {
      console.error("[Ошибка удаления оффера]", e, e?.response);
      setMessage(
        t("something_went_wrong") +
          ": " +
          (e?.response?.data?.error || e?.message || t("something_went_wrong"))
      );
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={isMobile ? 1 : 3}>
      <Typography variant="h5" gutterBottom>
        {t("my_offers")}
      </Typography>
      {message && (
        <Typography color="error" sx={{ mb: 2 }}>
          {message}
        </Typography>
      )}
      {isMobile ? (
        <Box>
          {offers.length > 0 ? (
            offers.map(renderMobileCard)
          ) : (
            <Typography variant="body1" align="center" sx={{ mt: 2 }}>
              {t("no_offers")}
            </Typography>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            maxWidth: "1200px",
            minWidth: "900px",
            mx: "auto",
            borderRadius: 3,
            boxShadow: 2,
          }}
        >
          <GenericTable
            headers={headers}
            rows={offers}
            renderRow={renderRow}
            isPaginationEnabled={false}
          />
          {offers.length === 0 && (
            <Typography variant="body1" align="center" sx={{ mt: 2 }}>
              {t("no_offers")}
            </Typography>
          )}
        </Box>
      )}
      <PromoteOfferModal
        open={promoteModal.open}
        onClose={() => setPromoteModal({ open: false, offerId: null })}
        offerId={promoteModal.offerId}
        onSuccess={() => {
          setPromoteModal({ open: false, offerId: null });
          fetchMyOffers();
        }}
      />
    </Box>
  );
};

export default UserOffersTableTab;
