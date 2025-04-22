import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "../../middleware/api";
import {
  Typography,
  Button,
  TableRow,
  TableCell,
  Select,
  MenuItem,
  CircularProgress,
  Pagination,
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  IconButton,
  Tooltip,
  Paper,
  FormControl,
  InputLabel,
} from "@mui/material";
import GenericTable from "./GenericTable";
import FilterControls from "./FilterControls";
import CreateOfferDialog from "./CreateOfferDialog";
import EditOfferDialog from "./EditOfferDialog";
import { Snackbar, Alert } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PromotionDialog from "./PromotionDialog";

const OffersTab = () => {
  const { t } = useTranslation();
  const [offers, setOffers] = useState([]);
  const [offerStatusFilter, setOfferStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);

  const limit = 10;

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/offers", {
        params: {
          status: offerStatusFilter || undefined,
          page,
          limit,
        },
      });
      setOffers(res.data.offers);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (error) {
      setSnackbar({
        open: true,
        message: t("error_fetching_offers"),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [offerStatusFilter, page, limit, t]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleEdit = (offerId) => {
    setSelectedOfferId(offerId);
    setOpenEditDialog(true);
  };

  const handleDelete = async (offerId) => {
    if (window.confirm(t("confirm_delete_offer"))) {
      try {
        await api.delete(`/admin/offers/${offerId}`);
        await fetchOffers();
        setSnackbar({
          open: true,
          message: t("offer_deleted"),
          severity: "success",
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: t("error_deleting_offer"),
          severity: "error",
        });
      }
    }
  };

  const handleStatusChange = async (offerId, newStatus) => {
    try {
      // Находим полный объект предложения
      const offer = offers.find((o) => o._id === offerId);
      if (!offer) {
        throw new Error("Offer not found");
      }

      // Преобразуем статус в зависимости от типа
      const statusToSend =
        offer.type === "Offer"
          ? newStatus.toUpperCase()
          : newStatus.toLowerCase();

      console.log("Found offer:", offer);
      console.log("Changing status:", {
        offerId,
        newStatus: statusToSend,
        offerType: offer.type,
        currentStatus: offer.status,
      });

      const response = await api.patch(`/admin/offers/${offerId}/status`, {
        status: statusToSend,
        type: offer.type || "Offer",
      });

      console.log("Status update response:", response.data);

      // Обновляем состояние локально, чтобы избежать перезагрузки
      setOffers(
        offers.map((o) =>
          o._id === offerId ? { ...o, status: statusToSend } : o
        )
      );

      setSnackbar({
        open: true,
        message: t("status_updated"),
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating status:", error.response?.data || error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || t("error_updating_status"),
        severity: "error",
      });
    }
  };

  // Получаем доступные статусы в зависимости от типа объекта
  const getAvailableStatusesForType = (type) => {
    switch (type) {
      case "ServiceRequest":
        return [
          { value: "pending", label: t("status_pending") },
          { value: "accepted", label: t("status_accepted") },
          { value: "completed", label: t("status_completed") },
        ];
      case "ServiceOffer":
        return [
          { value: "pending", label: t("status_pending") },
          { value: "active", label: t("status_active") },
          { value: "inactive", label: t("status_inactive") },
        ];
      default: // Offer
        return [
          { value: "PENDING", label: t("status_pending") },
          { value: "ACTIVE", label: t("status_active") },
          { value: "INACTIVE", label: t("status_inactive") },
          { value: "REJECTED", label: t("status_rejected") },
          { value: "COMPLETED", label: t("status_completed") },
        ];
    }
  };

  const handlePromotionClick = (offerId) => {
    setSelectedOfferId(offerId);
    setPromotionDialogOpen(true);
  };

  const handlePromotionAdded = () => {
    fetchOffers();
  };

  const handleOfferCreated = () => {
    setOpenCreateDialog(false);
    setPage(1); // Сброс на первую страницу
    fetchOffers();
  };

  const handleOfferUpdated = () => {
    setOpenEditDialog(false);
    fetchOffers();
  };

  const headers = [
    "ID",
    t("type"),
    t("service_type"),
    t("description"),
    t("price"),
    t("location"),
    t("status"),
    t("created_at"),
    t("promotions"),
    t("actions"),
  ];

  const renderRow = (offer) => (
    <TableRow key={offer._id}>
      <TableCell>{offer._id}</TableCell>
      <TableCell>{offer.type}</TableCell>
      <TableCell>{t(offer.serviceType)}</TableCell>
      <TableCell>{offer.description}</TableCell>
      <TableCell>{offer.price || "N/A"}</TableCell>
      <TableCell>{offer.location || "N/A"}</TableCell>
      <TableCell>
        <FormControl size="small" fullWidth>
          <Select
            value={offer.status || ""}
            onChange={(e) => handleStatusChange(offer._id, e.target.value)}
            size="small"
          >
            {getAvailableStatusesForType(offer.type).map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </TableCell>
      <TableCell>{new Date(offer.createdAt).toLocaleDateString()}</TableCell>
      <TableCell>
        {offer.activePromotions?.map((promo) => (
          <Tooltip
            key={promo._id}
            title={`${t(promo.type.toLowerCase())} - ${new Date(
              promo.endDate
            ).toLocaleDateString()}`}
          >
            <LocalOfferIcon color="primary" sx={{ mr: 1 }} />
          </Tooltip>
        ))}
      </TableCell>
      <TableCell>
        <IconButton onClick={() => handleEdit(offer._id)}>
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => handleDelete(offer._id)}>
          <DeleteIcon />
        </IconButton>
        <IconButton onClick={() => handlePromotionClick(offer._id)}>
          <LocalOfferIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t("offers")}
      </Typography>
      <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
        <FormControl
          variant="outlined"
          style={{ minWidth: 200, marginBottom: 20 }}
        >
          <InputLabel>{t("filter_by_status")}</InputLabel>
          <Select
            value={offerStatusFilter}
            onChange={(e) => setOfferStatusFilter(e.target.value)}
            label={t("filter_by_status")}
          >
            <MenuItem value="">
              <em>{t("all")}</em>
            </MenuItem>
            {getAvailableStatusesForType("Offer").map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenCreateDialog(true)}
        >
          {t("create_offer")}
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", padding: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("title")}</TableCell>
                  <TableCell>{t("category")}</TableCell>
                  <TableCell>{t("price")}</TableCell>
                  <TableCell>{t("status")}</TableCell>
                  <TableCell>{t("promotions")}</TableCell>
                  <TableCell>{t("actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer._id}>
                    <TableCell>{offer.title || offer.serviceType}</TableCell>
                    <TableCell>
                      {t(offer.category || offer.serviceType)}
                    </TableCell>
                    <TableCell>{offer.price}</TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={offer.status || ""}
                          onChange={(e) =>
                            handleStatusChange(offer._id, e.target.value)
                          }
                          size="small"
                        >
                          {getAvailableStatusesForType(offer.type).map(
                            (status) => (
                              <MenuItem key={status.value} value={status.value}>
                                {status.label}
                              </MenuItem>
                            )
                          )}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      {offer.activePromotions?.map((promo) => (
                        <Tooltip
                          key={promo._id}
                          title={`${t(promo.type.toLowerCase())} - ${new Date(
                            promo.endDate
                          ).toLocaleDateString()}`}
                        >
                          <LocalOfferIcon color="primary" sx={{ mr: 1 }} />
                        </Tooltip>
                      ))}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(offer._id)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(offer._id)}>
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handlePromotionClick(offer._id)}
                      >
                        <LocalOfferIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}
      <CreateOfferDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onOfferCreated={handleOfferCreated}
      />
      <EditOfferDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        offerId={selectedOfferId}
        onOfferUpdated={handleOfferUpdated}
      />
      <PromotionDialog
        open={promotionDialogOpen}
        onClose={() => setPromotionDialogOpen(false)}
        offerId={selectedOfferId}
        onPromotionAdded={handlePromotionAdded}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OffersTab;
