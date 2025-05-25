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
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Stack,
  Divider,
  IconButton,
} from "@mui/material";
import GenericTable from "./GenericTable";
import FilterControls from "./FilterControls";
import CreateRequestDialog from "./CreateRequestDialog";
import EditRequestDialog from "./EditRequestDialog";
import { Snackbar, Alert } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const RequestCardMobile = ({ request, t, onEdit, onDelete }) => (
  <Card sx={{ mb: 2, boxShadow: 2 }}>
    <CardContent>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography variant="subtitle2" color="text.secondary">
          {request._id}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(request.createdAt).toLocaleDateString()}
        </Typography>
      </Stack>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        {request.userId?.name || "N/A"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {t(request.serviceType)}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {request.description}
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 0.5 }}>
        <Typography variant="body2" color="primary.main">
          {request.location || "-"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(request.status)}
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
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const limit = 10;

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/requests", {
        params: { status: requestStatusFilter, page, limit },
      });
      setRequests(res.data.requests);
      setTotalPages(res.data.pages);
    } catch (error) {
      if (axios.isCancel && axios.isCancel(error)) {
        // Игнорируем отмену дублирующегося запроса
        return;
      }
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
  }, [requestStatusFilter, page, fetchRequests]);

  const handleChangeRequestStatus = async (requestId, newStatus) => {
    try {
      const res = await axios.patch(`/admin/requests/${requestId}/status`, {
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
        await axios.delete(`/admin/requests/${requestId}`);
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
          sx={isMobile ? { mt: 2 } : {}}
        >
          {t("create_request")}
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", padding: 2 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Box>
          {requests.map((request) => (
            <RequestCardMobile
              key={request._id}
              request={request}
              t={t}
              onEdit={() => {
                setSelectedRequestId(request._id);
                setOpenEditDialog(true);
              }}
              onDelete={() => handleDeleteRequest(request._id)}
            />
          ))}
        </Box>
      ) : (
        <GenericTable
          headers={headers}
          rows={requests}
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
