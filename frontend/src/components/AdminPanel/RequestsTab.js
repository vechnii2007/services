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
} from "@mui/material";
import GenericTable from "./GenericTable";
import FilterControls from "./FilterControls";
import CreateRequestDialog from "./CreateRequestDialog";
import EditRequestDialog from "./EditRequestDialog";
import { Snackbar, Alert } from "@mui/material";

const RequestsTab = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const limit = 10;

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/requests", {
        params: { status: requestStatusFilter, page, limit },
      });
      setRequests(res.data.requests);
      setTotalPages(res.data.pages);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error fetching requests",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [requestStatusFilter, page, limit]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleChangeRequestStatus = async (requestId, newStatus) => {
    try {
      const res = await api.patch(`/admin/requests/${requestId}/status`, {
        status: newStatus,
      });
      setRequests(
        requests.map((request) =>
          request._id === requestId ? res.data : request
        )
      );
      setSnackbar({
        open: true,
        message: "Request status updated",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error changing request status",
        severity: "error",
      });
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm(t("confirm_delete_request"))) {
      try {
        await api.delete(`/admin/requests/${requestId}`);
        setRequests(requests.filter((request) => request._id !== requestId));
        setSnackbar({
          open: true,
          message: "Request deleted",
          severity: "success",
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Error deleting request",
          severity: "error",
        });
      }
    }
  };

  const handleRequestCreated = () => {
    setOpenCreateDialog(false);
    setPage(1); // Сброс на первую страницу
    fetchRequests();
  };

  const handleRequestUpdated = () => {
    setOpenEditDialog(false);
    fetchRequests();
  };

  const headers = [
    "ID",
    t("user"),
    t("service_type"),
    t("description"),
    t("location"),
    t("status"),
    t("created_at"),
    t("actions"),
  ];

  const renderRow = (request) => (
    <TableRow key={request._id}>
      <TableCell>{request._id}</TableCell>
      <TableCell>{request.userId?.name || "N/A"}</TableCell>
      <TableCell>{t(request.serviceType)}</TableCell>
      <TableCell>{request.description}</TableCell>
      <TableCell>{request.location}</TableCell>
      <TableCell>
        <Select
          value={request.status}
          onChange={(e) =>
            handleChangeRequestStatus(request._id, e.target.value)
          }
        >
          <MenuItem value="pending">{t("pending")}</MenuItem>
          <MenuItem value="accepted">{t("accepted")}</MenuItem>
          <MenuItem value="completed">{t("completed")}</MenuItem>
        </Select>
      </TableCell>
      <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
      <TableCell>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedRequestId(request._id);
            setOpenEditDialog(true);
          }}
          sx={{ marginRight: 1 }}
        >
          {t("edit")}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => handleDeleteRequest(request._id)}
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
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t("requests")}
      </Typography>
      <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
        <FilterControls
          selectLabel="status"
          selectValue={requestStatusFilter}
          onSelectChange={(e) => {
            setRequestStatusFilter(e.target.value);
            setPage(1);
          }}
          selectOptions={statusOptions}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenCreateDialog(true)}
        >
          {t("create_request")}
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
            rows={requests}
            renderRow={renderRow}
          />
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
      <CreateRequestDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onRequestCreated={handleRequestCreated}
      />
      <EditRequestDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        requestId={selectedRequestId}
        onRequestUpdated={handleRequestUpdated}
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

export default RequestsTab;
