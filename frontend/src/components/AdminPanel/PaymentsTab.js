import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Stack,
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PaymentService from "../../services/PaymentService";
import PaymentDetailsDialog from "./PaymentDetailsDialog";

const PaymentsTab = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stats, setStats] = useState(null);

  // Фильтры
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    startDate: null,
    endDate: null,
  });

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
      };

      const data = await PaymentService.getAll(params);
      setPayments(data.payments);
      setTotal(data.total);

      // Получаем статистику
      const statsData = await PaymentService.getStats(params);
      setStats(statsData);
    } catch (e) {
      setError(e.response?.data?.message || t("error_loading_payments"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, rowsPerPage, filters]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setDetailsOpen(true);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await PaymentService.updateStatus(id, newStatus);
      fetchPayments();
    } catch (e) {
      setError(e.response?.data?.message || t("error_updating_status"));
    }
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t("payments_by_status")}
              </Typography>
              <Stack spacing={1}>
                {stats.byStatus.map((stat) => (
                  <Box
                    key={stat._id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Chip
                      label={t(stat._id)}
                      color={PaymentService.getStatusColor(stat._id)}
                      size="small"
                    />
                    <Typography>
                      {t("count")}: {stat.count} |{" "}
                      {PaymentService.formatAmount(stat.totalAmount)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t("payments_by_type")}
              </Typography>
              <Stack spacing={1}>
                {stats.byType.map((stat) => (
                  <Box
                    key={stat._id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography>{t(stat._id)}</Typography>
                    <Typography>
                      {t("count")}: {stat.count} |{" "}
                      {PaymentService.formatAmount(stat.totalAmount)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">{t("payments")}</Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchPayments}
          disabled={loading}
        >
          {t("refresh")}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {renderStats()}

      <Paper sx={{ mb: 2, p: 2 }}>
        <Stack direction="row" spacing={2} mb={2}>
          <TextField
            select
            label={t("status")}
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">{t("all")}</MenuItem>
            <MenuItem value="pending">{t("pending")}</MenuItem>
            <MenuItem value="paid">{t("paid", "Оплачено")}</MenuItem>
            <MenuItem value="failed">{t("failed")}</MenuItem>
            <MenuItem value="refunded">{t("refunded")}</MenuItem>
          </TextField>
          <TextField
            select
            label={t("type")}
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">{t("all")}</MenuItem>
            <MenuItem value="subscription">{t("subscription")}</MenuItem>
            <MenuItem value="one-time">{t("one-time")}</MenuItem>
          </TextField>
          <DatePicker
            label={t("start_date")}
            value={filters.startDate}
            onChange={(date) => handleFilterChange("startDate", date)}
            slotProps={{ textField: { sx: { minWidth: 150 } } }}
          />
          <DatePicker
            label={t("end_date")}
            value={filters.endDate}
            onChange={(date) => handleFilterChange("endDate", date)}
            slotProps={{ textField: { sx: { minWidth: 150 } } }}
          />
        </Stack>
      </Paper>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("id")}</TableCell>
                <TableCell>{t("user")}</TableCell>
                <TableCell>{t("tariff")}</TableCell>
                <TableCell>{t("amount")}</TableCell>
                <TableCell>{t("type")}</TableCell>
                <TableCell>{t("status")}</TableCell>
                <TableCell>{t("date")}</TableCell>
                <TableCell align="right">{t("actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>{payment._id}</TableCell>
                  <TableCell>
                    {payment.userId?.name || payment.userId?.email}
                  </TableCell>
                  <TableCell>{payment.tariffId?.name}</TableCell>
                  <TableCell>
                    {PaymentService.formatAmount(payment.amount)}
                  </TableCell>
                  <TableCell>{t(payment.type)}</TableCell>
                  <TableCell>
                    <Chip
                      label={t(payment.status)}
                      color={PaymentService.getStatusColor(payment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {PaymentService.formatDate(payment.createdAt)}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t("view_details")}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(payment)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={t("rows_per_page")}
          />
        </TableContainer>
      )}

      {selectedPayment && (
        <PaymentDetailsDialog
          open={detailsOpen}
          payment={selectedPayment}
          onClose={() => setDetailsOpen(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </Box>
  );
};

export default PaymentsTab;
