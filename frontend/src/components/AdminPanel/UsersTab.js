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
import CreateUserDialog from "./CreateUserDialog";
import EditUserDialog from "./EditUserDialog";
import { Snackbar, Alert } from "@mui/material";

const UsersTab = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const limit = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users", {
        params: { search: userFilter, role: userRoleFilter, page, limit },
      });
      setUsers(res.data.users);
      setTotalPages(res.data.pages);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error fetching users",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [userFilter, userRoleFilter, page, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBlockUser = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/status`);
      setUsers(users.map((user) => (user._id === userId ? res.data : user)));
      setSnackbar({
        open: true,
        message: "User status updated",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error updating user status",
        severity: "error",
      });
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, {
        role: newRole,
      });
      setUsers(users.map((user) => (user._id === userId ? res.data : user)));
      setSnackbar({
        open: true,
        message: "User role updated",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error changing role",
        severity: "error",
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm(t("confirm_delete_user"))) {
      try {
        await api.delete(`/admin/users/${userId}`);
        setUsers(users.filter((user) => user._id !== userId));
        setSnackbar({
          open: true,
          message: "User deleted",
          severity: "success",
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Error deleting user",
          severity: "error",
        });
      }
    }
  };

  const handleUserCreated = () => {
    setOpenCreateDialog(false);
    setPage(1); // Сброс на первую страницу
    fetchUsers();
  };

  const handleUserUpdated = () => {
    setOpenEditDialog(false);
    fetchUsers();
  };

  const headers = [
    "ID",
    t("name"),
    t("email"),
    t("role"),
    t("status"),
    t("created_at"),
    t("actions"),
  ];

  const renderRow = (user) => (
    <TableRow key={user._id}>
      <TableCell>{user._id}</TableCell>
      <TableCell>{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Select
          value={user.role}
          onChange={(e) => handleChangeRole(user._id, e.target.value)}
        >
          <MenuItem value="user">{t("user")}</MenuItem>
          <MenuItem value="provider">{t("provider")}</MenuItem>
          <MenuItem value="admin">{t("admin")}</MenuItem>
        </Select>
      </TableCell>
      <TableCell>{user.accountStatus}</TableCell>
      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
      <TableCell>
        <Button
          variant="contained"
          color={user.accountStatus === "active" ? "error" : "success"}
          onClick={() => handleBlockUser(user._id)}
          sx={{ marginRight: 1 }}
        >
          {user.accountStatus === "active" ? t("block") : t("unblock")}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedUserId(user._id);
            setOpenEditDialog(true);
          }}
          sx={{ marginRight: 1 }}
        >
          {t("edit")}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => handleDeleteUser(user._id)}
        >
          {t("delete")}
        </Button>
      </TableCell>
    </TableRow>
  );

  const roleOptions = [
    { value: "user", label: "user" },
    { value: "provider", label: "provider" },
    { value: "admin", label: "admin" },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t("users")}
      </Typography>

      <FilterControls
        searchValue={userFilter}
        onSearchChange={(e) => setUserFilter(e.target.value)}
        selectValue={userRoleFilter}
        onSelectChange={(e) => setUserRoleFilter(e.target.value)}
        selectOptions={roleOptions}
        onAddClick={() => setOpenCreateDialog(true)}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <GenericTable headers={headers} rows={users} renderRow={renderRow} />
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
            />
          </Box>
        </>
      )}

      <CreateUserDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onUserCreated={handleUserCreated}
      />

      <EditUserDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        onUserUpdated={handleUserUpdated}
        userId={selectedUserId}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersTab;
