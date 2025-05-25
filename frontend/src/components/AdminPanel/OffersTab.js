import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "../../utils/axiosConfig";
import {
  Typography,
  Button,
  TableRow,
  TableCell,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogActions,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Stack,
  IconButton,
  Divider,
} from "@mui/material";
import GenericTable from "./GenericTable";
import FilterControls from "./FilterControls";
import CreateOfferDialog from "./CreateOfferDialog";
import EditOfferDialog from "./EditOfferDialog";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const OfferCardMobile = ({ offer, onEdit, onDelete, t }) => (
  <Card sx={{ mb: 2, boxShadow: 2 }}>
    <CardContent>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography variant="subtitle2" color="text.secondary">
          {offer._id}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(offer.createdAt).toLocaleDateString()}
        </Typography>
      </Stack>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        {offer.title || t("no_title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {t(offer.serviceType)}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {offer.description}
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 0.5 }}>
        <Typography variant="body2" color="primary.main">
          {offer.price ? `${offer.price} €` : "N/A"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {offer.location || "-"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(offer.status)}
        </Typography>
      </Stack>
    </CardContent>
    <Divider />
    <CardActions sx={{ justifyContent: "flex-end" }}>
      <IconButton color="primary" onClick={onEdit} size="large">
        <EditIcon />
      </IconButton>
      <IconButton color="error" onClick={onDelete} size="large">
        <DeleteIcon />
      </IconButton>
    </CardActions>
  </Card>
);

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
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    offer: null,
  });
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const limit = 10;

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/offers", {
        params: { status: offerStatusFilter, page, limit },
      });
      setOffers(res.data.offers);
      setTotalPages(res.data.pages);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error fetching offers",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [offerStatusFilter, page, limit]);

  useEffect(() => {
    fetchOffers();
  }, [offerStatusFilter, page, fetchOffers]);

  const handleChangeOfferStatus = async (offerId, newStatus, type) => {
    try {
      const res = await axios.patch(`/admin/offers/${offerId}/status`, {
        status: newStatus,
        type,
      });
      setOffers(
        offers.map((offer) => (offer._id === offerId ? res.data : offer))
      );
      setSnackbar({
        open: true,
        message: "Offer status updated",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error changing offer status",
        severity: "error",
      });
    }
  };

  const handleDeleteOffer = async (offerId, type) => {
    const offer = offers.find((o) => o._id === offerId);
    console.log("Удаление предложения:", offerId, type, offer);
    const validTypes = ["Offer", "ServiceOffer", "ServiceRequest"];
    let actualType = type;
    if (!validTypes.includes(type)) {
      if (offer && validTypes.includes(offer.type)) {
        actualType = offer.type;
      } else {
        actualType = "Offer";
      }
    }
    if (!validTypes.includes(actualType)) {
      setSnackbar({
        open: true,
        message: `Ошибка: некорректный тип предложения (${type})`,
        severity: "error",
      });
      return;
    }
    try {
      await axios.delete(`/admin/offers/${offerId}`, {
        data: { type: actualType },
      });
      setOffers(offers.filter((offer) => offer._id !== offerId));
      setSnackbar({
        open: true,
        message: "Offer deleted",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error deleting offer",
        severity: "error",
      });
    }
    setDeleteDialog({ open: false, offer: null });
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
        <Select
          value={offer.status}
          onChange={(e) =>
            handleChangeOfferStatus(offer._id, e.target.value, offer.type)
          }
        >
          {offer.type === "ServiceRequest" ? (
            <>
              <MenuItem value="pending">{t("pending")}</MenuItem>
              <MenuItem value="accepted">{t("accepted")}</MenuItem>
              <MenuItem value="completed">{t("completed")}</MenuItem>
            </>
          ) : (
            <>
              <MenuItem value="pending">{t("pending")}</MenuItem>
              <MenuItem value="accepted">{t("accepted")}</MenuItem>
              <MenuItem value="rejected">{t("rejected")}</MenuItem>
            </>
          )}
        </Select>
      </TableCell>
      <TableCell>{new Date(offer.createdAt).toLocaleDateString()}</TableCell>
      <TableCell>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedOfferId(offer._id);
            setOpenEditDialog(true);
          }}
          sx={{ marginRight: 1 }}
        >
          {t("edit")}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => setDeleteDialog({ open: true, offer })}
        >
          {t("delete")}
        </Button>
      </TableCell>
    </TableRow>
  );

  const statusOptions = [
    { value: "pending", label: "pending" },
    { value: "accepted", label: "accepted" },
    { value: "completed", label: "completed" },
    { value: "rejected", label: "rejected" },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t("offers")}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: 2,
          mb: 2,
        }}
      >
        <FilterControls
          selectLabel="status"
          selectValue={offerStatusFilter}
          onSelectChange={(e) => {
            setOfferStatusFilter(e.target.value);
            setPage(1);
          }}
          selectOptions={statusOptions}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenCreateDialog(true)}
          sx={isMobile ? { mt: 2 } : {}}
        >
          {t("create_offer")}
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", padding: 2 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Box>
          {offers.map((offer) => (
            <OfferCardMobile
              key={offer._id}
              offer={offer}
              t={t}
              onEdit={() => {
                setSelectedOfferId(offer._id);
                setOpenEditDialog(true);
              }}
              onDelete={() => setDeleteDialog({ open: true, offer })}
            />
          ))}
        </Box>
      ) : (
        <GenericTable
          headers={headers}
          rows={offers}
          renderRow={renderRow}
          isPaginationEnabled={true}
          page={page - 1}
          rowsPerPage={limit}
          count={totalPages * limit}
          onPageChange={(e, newPage) => setPage(newPage + 1)}
          onRowsPerPageChange={(e) => {
            // If rowsPerPage functionality needed, implement here
            // This would require API endpoint supporting variable limit
          }}
        />
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
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, offer: null })}
      >
        <DialogTitle>{t("confirm_delete_offer")}</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, offer: null })}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => {
              if (deleteDialog.offer) {
                handleDeleteOffer(
                  deleteDialog.offer._id,
                  deleteDialog.offer.type
                );
              }
            }}
            color="error"
            variant="contained"
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OffersTab;
