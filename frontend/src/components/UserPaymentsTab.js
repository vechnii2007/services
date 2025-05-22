import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  TablePagination,
} from "@mui/material";
import PaymentService from "../services/PaymentService";

const PaymentStatusChip = ({ status }) => {
  const { t } = useTranslation();

  const statusConfig = {
    pending: { color: "warning", label: t("status_pending") },
    paid: { color: "success", label: t("status_paid", "Оплачено") },
    failed: { color: "error", label: t("status_failed") },
    refunded: { color: "default", label: t("status_refunded") },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return <Chip size="small" {...config} />;
};

const UserPaymentsTab = ({ userId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await PaymentService.getUserPayments(userId, {
        page: page + 1,
        limit: rowsPerPage,
      });
      setPayments(Array.isArray(response.data) ? response.data : []);
      setTotal(typeof response.total === "number" ? response.total : 0);
    } catch (e) {
      console.error("Error fetching payments:", e);
      setError(e.response?.data?.message || t("error_loading_payments"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, rowsPerPage, userId]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading && !payments.length) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!payments.length) {
    return (
      <Box p={3}>
        <Alert severity="info">{t("no_payments")}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        {t("payment_history")}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("date")}</TableCell>
              <TableCell>{t("tariff")}</TableCell>
              <TableCell>{t("type")}</TableCell>
              <TableCell align="right">{t("amount")}</TableCell>
              <TableCell>{t("status")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment._id}>
                <TableCell>
                  {new Date(payment.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{payment.tariff?.name || "-"}</TableCell>
                <TableCell>{t(payment.type)}</TableCell>
                <TableCell align="right">
                  {new Intl.NumberFormat("ru-RU", {
                    style: "currency",
                    currency: "EUR",
                  }).format(payment.amount)}
                </TableCell>
                <TableCell>
                  <PaymentStatusChip status={payment.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={t("rows_per_page")}
      />
    </Box>
  );
};

export default UserPaymentsTab;
