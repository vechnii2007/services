import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import GenericTable from "./GenericTable";
import FilterControls from "./FilterControls";
import CreateOfferDialog from "./CreateOfferDialog";
import EditOfferDialog from "./EditOfferDialog";
import { Snackbar, Alert } from "@mui/material";

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

  const limit = 10;

  const fetchOffers = async () => {
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
  };

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
    if (window.confirm(t("confirm_delete_offer"))) {
      try {
        await axios.delete(`/admin/offers/${offerId}`, { data: { type } });
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
    }
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
          onClick={() => handleDeleteOffer(offer._id, offer.type)}
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
      <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
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
