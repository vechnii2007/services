import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Switch,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  TableSortLabel,
  TextField,
  InputAdornment,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import TariffService from "../../services/TariffService";
import TariffFormDialog from "./TariffFormDialog";
import { toast } from "react-hot-toast";

const TariffsTab = () => {
  const { t } = useTranslation();
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTariff, setEditTariff] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [error, setError] = useState(null);

  // Пагинация
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Сортировка
  const [orderBy, setOrderBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  // Фильтрация
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const fetchTariffs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await TariffService.getAll();
      setTariffs(data);
    } catch (e) {
      setError(e.response?.data?.message || t("error_loading_tariffs"));
      toast.error(t("error_loading_tariffs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTariffs();
  }, []);

  const handleToggleActive = async (id) => {
    try {
      await TariffService.toggleActive(id);
      toast.success(t("status_updated"));
      fetchTariffs();
    } catch (e) {
      toast.error(t("error_updating_status"));
    }
  };

  const handleDeleteClick = (tariff) => {
    setSelectedTariff(tariff);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await TariffService.delete(selectedTariff._id);
      toast.success(t("tariff_deleted"));
      setDeleteConfirmOpen(false);
      fetchTariffs();
    } catch (e) {
      toast.error(t("error_deleting_tariff"));
    }
  };

  const handleOpenCreate = () => {
    setEditTariff(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (tariff) => {
    setEditTariff(tariff);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmitDialog = async (values) => {
    try {
      if (editTariff) {
        await TariffService.update(editTariff._id, values);
        toast.success(t("tariff_updated"));
      } else {
        await TariffService.create(values);
        toast.success(t("tariff_created"));
      }
      setDialogOpen(false);
      fetchTariffs();
    } catch (e) {
      toast.error(
        editTariff ? t("error_updating_tariff") : t("error_creating_tariff")
      );
    }
  };

  // Обработчики пагинации
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Обработчик сортировки
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Фильтрация и сортировка данных
  const filteredTariffs = tariffs
    .filter((tariff) => {
      const matchesSearch =
        tariff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tariff.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || tariff.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const isAsc = order === "asc";
      if (orderBy === "price") {
        return isAsc ? a.price - b.price : b.price - a.price;
      }
      return isAsc
        ? a[orderBy] < b[orderBy]
          ? -1
          : 1
        : b[orderBy] < a[orderBy]
        ? -1
        : 1;
    });

  const paginatedTariffs = filteredTariffs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">{t("tariffs")}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          {t("create_tariff")}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          size="small"
          placeholder={t("search_tariffs")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {loading ? (
        <CircularProgress />
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "name"}
                      direction={orderBy === "name" ? order : "asc"}
                      onClick={() => handleRequestSort("name")}
                    >
                      {t("name")}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>{t("description")}</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "price"}
                      direction={orderBy === "price" ? order : "asc"}
                      onClick={() => handleRequestSort("price")}
                    >
                      {t("price")}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>{t("type")}</TableCell>
                  <TableCell>{t("period")}</TableCell>
                  <TableCell>{t("active")}</TableCell>
                  <TableCell align="right">{t("actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTariffs.map((tariff) => (
                  <TableRow key={tariff._id}>
                    <TableCell>{tariff.name}</TableCell>
                    <TableCell>{tariff.description}</TableCell>
                    <TableCell>{formatPrice(tariff.price)}</TableCell>
                    <TableCell>{t(tariff.type)}</TableCell>
                    <TableCell>
                      {tariff.period
                        ? t("days", { count: tariff.period })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={tariff.isActive}
                        onChange={() => handleToggleActive(tariff._id)}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEdit(tariff)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(tariff)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredTariffs.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={t("rows_per_page")}
          />
        </Paper>
      )}

      <TariffFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitDialog}
        initialValues={
          editTariff || TariffFormDialog.defaultProps.initialValues
        }
        isEdit={!!editTariff}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>{t("confirm_delete")}</DialogTitle>
        <DialogContent>
          {t("delete_tariff_confirmation", { name: selectedTariff?.name })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
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

export default TariffsTab;
