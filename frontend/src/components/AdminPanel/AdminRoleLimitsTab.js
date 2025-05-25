import React, { useEffect, useState } from "react";
import axios from "../../utils/axiosConfig";
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  IconButton,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Divider,
  Stack,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const defaultLimit = {
  role: "provider",
  type: "free",
  limits: {
    maxActiveOffers: 3,
    maxTopOffers: 1,
    maxActiveRequests: 3,
    analytics: false,
    premiumBadge: false,
    prioritySupport: false,
  },
  description: "",
};

const LimitCardMobile = ({ lim, onEdit, onDelete }) => (
  <Card sx={{ mb: 2, boxShadow: 2 }}>
    <CardContent>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography variant="subtitle2" color="text.secondary">
          {lim.role} / {lim.type}
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        <b>Активных объявлений:</b> {lim.limits.maxActiveOffers}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        <b>Топ-объявлений:</b> {lim.limits.maxTopOffers}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        <b>Активных заявок:</b> {lim.limits.maxActiveRequests}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        <b>Аналитика:</b> {lim.limits.analytics ? "Да" : "Нет"}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        <b>Бейдж:</b> {lim.limits.premiumBadge ? "Да" : "Нет"}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        <b>Приоритет:</b> {lim.limits.prioritySupport ? "Да" : "Нет"}
      </Typography>
      {lim.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {lim.description}
        </Typography>
      )}
    </CardContent>
    <Divider />
    <CardActions sx={{ justifyContent: "flex-end" }}>
      <IconButton color="primary" onClick={() => onEdit(lim)} size="large">
        <EditIcon />
      </IconButton>
      <IconButton color="error" onClick={() => onDelete(lim._id)} size="large">
        <DeleteIcon />
      </IconButton>
    </CardActions>
  </Card>
);

const AdminRoleLimitsTab = () => {
  const [limits, setLimits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(defaultLimit);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const fetchLimits = async () => {
    setLoading(true);
    const res = await axios.get("/admin/role-limits");
    setLimits(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const handleOpenDialog = (limit) => {
    setForm(limit ? { ...limit } : defaultLimit);
    setEditId(limit?._id || null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditId(null);
    setForm(defaultLimit);
  };

  const handleChange = (field, value) => {
    if (field.startsWith("limits.")) {
      const key = field.split(".")[1];
      setForm((prev) => ({
        ...prev,
        limits: { ...prev.limits, [key]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (editId) {
      await axios.patch(`/admin/role-limits/${editId}`, form);
    } else {
      await axios.post("/admin/role-limits", form);
    }
    handleCloseDialog();
    fetchLimits();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Удалить лимит?")) {
      await axios.delete(`/admin/role-limits/${id}`);
      fetchLimits();
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Лимиты и тарифы по ролям
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpenDialog()}
        sx={isMobile ? { mb: 2, width: "100%" } : { mb: 2 }}
      >
        Создать лимит
      </Button>
      {isMobile ? (
        <Box>
          {limits.map((lim) => (
            <LimitCardMobile
              key={lim._id}
              lim={lim}
              onEdit={handleOpenDialog}
              onDelete={handleDelete}
            />
          ))}
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Роль</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Активных объявлений</TableCell>
              <TableCell>Топ-объявлений</TableCell>
              <TableCell>Активных заявок</TableCell>
              <TableCell>Аналитика</TableCell>
              <TableCell>Бейдж</TableCell>
              <TableCell>Приоритет</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {limits.map((lim) => (
              <TableRow key={lim._id}>
                <TableCell>{lim.role}</TableCell>
                <TableCell>{lim.type}</TableCell>
                <TableCell>{lim.limits.maxActiveOffers}</TableCell>
                <TableCell>{lim.limits.maxTopOffers}</TableCell>
                <TableCell>{lim.limits.maxActiveRequests}</TableCell>
                <TableCell>{lim.limits.analytics ? "Да" : "Нет"}</TableCell>
                <TableCell>{lim.limits.premiumBadge ? "Да" : "Нет"}</TableCell>
                <TableCell>
                  {lim.limits.prioritySupport ? "Да" : "Нет"}
                </TableCell>
                <TableCell>{lim.description}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleOpenDialog(lim)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(lim._id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editId ? "Редактировать лимит" : "Создать лимит"}
        </DialogTitle>
        <DialogContent sx={{ minWidth: 350 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Select
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              fullWidth
            >
              <MenuItem value="provider">Провайдер</MenuItem>
              <MenuItem value="user">Пользователь</MenuItem>
            </Select>
            <Select
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              fullWidth
            >
              <MenuItem value="free">Бесплатный</MenuItem>
              <MenuItem value="premium">Премиум</MenuItem>
            </Select>
            <TextField
              label="Макс. активных объявлений"
              type="number"
              value={form.limits.maxActiveOffers}
              onChange={(e) =>
                handleChange("limits.maxActiveOffers", Number(e.target.value))
              }
              fullWidth
            />
            <TextField
              label="Макс. топ-объявлений"
              type="number"
              value={form.limits.maxTopOffers}
              onChange={(e) =>
                handleChange("limits.maxTopOffers", Number(e.target.value))
              }
              fullWidth
            />
            <TextField
              label="Макс. активных заявок"
              type="number"
              value={form.limits.maxActiveRequests}
              onChange={(e) =>
                handleChange("limits.maxActiveRequests", Number(e.target.value))
              }
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.limits.analytics}
                  onChange={(e) =>
                    handleChange("limits.analytics", e.target.checked)
                  }
                />
              }
              label="Аналитика"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.limits.premiumBadge}
                  onChange={(e) =>
                    handleChange("limits.premiumBadge", e.target.checked)
                  }
                />
              }
              label="Бейдж премиум"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.limits.prioritySupport}
                  onChange={(e) =>
                    handleChange("limits.prioritySupport", e.target.checked)
                  }
                />
              }
              label="Приоритетная поддержка"
            />
            <TextField
              label="Описание"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminRoleLimitsTab;
