import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AdminService from "../services/AdminService";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

const AdminPanel = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userFilter, setUserFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState("");
  const [offerStatusFilter, setOfferStatusFilter] = useState("");
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    label: "",
    image: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await AdminService.getUsers();
        setUsers(usersData.users || []);
        const requestsData = await AdminService.getRequests();
        setRequests(requestsData.requests || []);
        const offersData = await AdminService.getOffers();
        setOffers(offersData.offers || []);
        const categoriesData = await AdminService.getCategories();
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      (user.name.toLowerCase().includes(userFilter.toLowerCase()) ||
        user.email.toLowerCase().includes(userFilter.toLowerCase())) &&
      (userRoleFilter ? user.role === userRoleFilter : true)
  );

  const filteredRequests = requests.filter((request) =>
    requestStatusFilter ? request.status === requestStatusFilter : true
  );

  const filteredOffers = offers.filter((offer) =>
    offerStatusFilter ? offer.status === offerStatusFilter : true
  );

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBlockUser = async (userId) => {
    try {
      const updatedUser = await AdminService.updateUser(userId, {
        status: "blocked",
      });
      setUsers(users.map((user) => (user._id === userId ? updatedUser : user)));
    } catch (error) {
      console.error("Error blocking user:", error);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const updatedUser = await AdminService.updateUser(userId, {
        role: newRole,
      });
      setUsers(users.map((user) => (user._id === userId ? updatedUser : user)));
    } catch (error) {
      console.error("Error changing role:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm(t("confirm_delete_user"))) {
      try {
        await AdminService.deleteUser(userId);
        setUsers(users.filter((user) => user._id !== userId));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleChangeRequestStatus = async (requestId, newStatus) => {
    try {
      const updatedRequest = await AdminService.updateRequest(requestId, {
        status: newStatus,
      });
      setRequests(
        requests.map((request) =>
          request._id === requestId ? updatedRequest : request
        )
      );
    } catch (error) {
      console.error("Error changing request status:", error);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm(t("confirm_delete_request"))) {
      try {
        await AdminService.deleteRequest(requestId);
        setRequests(requests.filter((request) => request._id !== requestId));
      } catch (error) {
        console.error("Error deleting request:", error);
      }
    }
  };

  const handleChangeOfferStatus = async (offerId, newStatus, type) => {
    try {
      const updatedOffer = await AdminService.updateOffer(offerId, {
        status: newStatus,
        type,
      });
      setOffers(
        offers.map((offer) => (offer._id === offerId ? updatedOffer : offer))
      );
    } catch (error) {
      console.error("Error changing offer status:", error);
    }
  };

  const handleDeleteOffer = async (offerId, type) => {
    if (window.confirm(t("confirm_delete_offer"))) {
      try {
        await AdminService.deleteOffer(offerId, type);
        setOffers(offers.filter((offer) => offer._id !== offerId));
      } catch (error) {
        console.error("Error deleting offer:", error);
      }
    }
  };

  const handleOpenCategoryDialog = (category = null) => {
    setEditingCategory(category);
    setNewCategory(
      category
        ? { name: category.name, label: category.label, image: null }
        : { name: "", label: "", image: null }
    );
    setOpenCategoryDialog(true);
  };

  const handleCloseCategoryDialog = () => {
    setOpenCategoryDialog(false);
    setEditingCategory(null);
    setNewCategory({ name: "", label: "", image: null });
  };

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setNewCategory({ ...newCategory, [name]: value });
  };

  const handleImageChange = (e) => {
    setNewCategory({ ...newCategory, image: e.target.files[0] });
  };

  const handleSaveCategory = async () => {
    try {
      const formData = new FormData();
      formData.append("name", newCategory.name);
      formData.append("label", newCategory.label);
      if (newCategory.image) {
        formData.append("image", newCategory.image);
      }

      let updatedCategory;
      if (editingCategory) {
        updatedCategory = await AdminService.updateCategory(
          editingCategory._id,
          formData
        );
        setCategories(
          categories.map((cat) =>
            cat._id === editingCategory._id ? updatedCategory : cat
          )
        );
      } else {
        updatedCategory = await AdminService.createCategory(formData);
        setCategories([...categories, updatedCategory]);
      }
      handleCloseCategoryDialog();
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm(t("confirm_delete_category"))) {
      try {
        await AdminService.deleteCategory(categoryId);
        setCategories(categories.filter((cat) => cat._id !== categoryId));
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("admin_panel")}
      </Typography>
      <Tabs
        value={tabValue}
        onChange={handleChangeTab}
        sx={{ marginBottom: 4 }}
      >
        <Tab label={t("users")} />
        <Tab label={t("requests")} />
        <Tab label={t("offers")} />
        <Tab label={t("categories")} />
      </Tabs>

      {/* Вкладка: Пользователи */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {t("users")}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
            <TextField
              label={t("search_by_name_or_email")}
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              variant="outlined"
              sx={{ width: 300 }}
            />
            <FormControl sx={{ width: 200 }}>
              <InputLabel>{t("role")}</InputLabel>
              <Select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                label={t("role")}
              >
                <MenuItem value="">{t("all")}</MenuItem>
                <MenuItem value="user">{t("user")}</MenuItem>
                <MenuItem value="provider">{t("provider")}</MenuItem>
                <MenuItem value="admin">{t("admin")}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>{t("name")}</TableCell>
                  <TableCell>{t("email")}</TableCell>
                  <TableCell>{t("role")}</TableCell>
                  <TableCell>{t("status")}</TableCell>
                  <TableCell>{t("created_at")}</TableCell>
                  <TableCell>{t("actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user._id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onChange={(e) =>
                          handleChangeRole(user._id, e.target.value)
                        }
                      >
                        <MenuItem value="user">{t("user")}</MenuItem>
                        <MenuItem value="provider">{t("provider")}</MenuItem>
                        <MenuItem value="admin">{t("admin")}</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>{user.accountStatus}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color={
                          user.accountStatus === "active" ? "error" : "success"
                        }
                        onClick={() => handleBlockUser(user._id)}
                        sx={{ marginRight: 1 }}
                      >
                        {user.accountStatus === "active"
                          ? t("block")
                          : t("unblock")}
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Вкладка: Запросы */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {t("requests")}
          </Typography>
          <Box sx={{ marginBottom: 2 }}>
            <FormControl sx={{ width: 200 }}>
              <InputLabel>{t("status")}</InputLabel>
              <Select
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
                label={t("status")}
              >
                <MenuItem value="">{t("all")}</MenuItem>
                <MenuItem value="pending">{t("pending")}</MenuItem>
                <MenuItem value="accepted">{t("accepted")}</MenuItem>
                <MenuItem value="completed">{t("completed")}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>{t("user")}</TableCell>
                  <TableCell>{t("service_type")}</TableCell>
                  <TableCell>{t("description")}</TableCell>
                  <TableCell>{t("location")}</TableCell>
                  <TableCell>{t("status")}</TableCell>
                  <TableCell>{t("created_at")}</TableCell>
                  <TableCell>{t("actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
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
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDeleteRequest(request._id)}
                      >
                        {t("delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Вкладка: Предложения */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {t("offers")}
          </Typography>
          <Box sx={{ marginBottom: 2 }}>
            <FormControl sx={{ width: 200 }}>
              <InputLabel>{t("status")}</InputLabel>
              <Select
                value={offerStatusFilter}
                onChange={(e) => setOfferStatusFilter(e.target.value)}
                label={t("status")}
              >
                <MenuItem value="">{t("all")}</MenuItem>
                <MenuItem value="pending">{t("pending")}</MenuItem>
                <MenuItem value="accepted">{t("accepted")}</MenuItem>
                <MenuItem value="completed">{t("completed")}</MenuItem>
                <MenuItem value="rejected">{t("rejected")}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>{t("type")}</TableCell>
                  <TableCell>{t("service_type")}</TableCell>
                  <TableCell>{t("description")}</TableCell>
                  <TableCell>{t("price")}</TableCell>
                  <TableCell>{t("location")}</TableCell>
                  <TableCell>{t("status")}</TableCell>
                  <TableCell>{t("created_at")}</TableCell>
                  <TableCell>{t("actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOffers.map((offer) => (
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
                          handleChangeOfferStatus(
                            offer._id,
                            e.target.value,
                            offer.type
                          )
                        }
                      >
                        {offer.type === "ServiceRequest" ? (
                          <>
                            <MenuItem value="pending">{t("pending")}</MenuItem>
                            <MenuItem value="accepted">
                              {t("accepted")}
                            </MenuItem>
                            <MenuItem value="completed">
                              {t("completed")}
                            </MenuItem>
                          </>
                        ) : (
                          <>
                            <MenuItem value="pending">{t("pending")}</MenuItem>
                            <MenuItem value="accepted">
                              {t("accepted")}
                            </MenuItem>
                            <MenuItem value="rejected">
                              {t("rejected")}
                            </MenuItem>
                          </>
                        )}
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDeleteOffer(offer._id, offer.type)}
                      >
                        {t("delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Вкладка: Категории */}
      {tabValue === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {t("categories")}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenCategoryDialog()}
            sx={{ marginBottom: 2 }}
          >
            {t("add_category")}
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>{t("name")}</TableCell>
                  <TableCell>{t("label")}</TableCell>
                  <TableCell>{t("image")}</TableCell>
                  <TableCell>{t("created_at")}</TableCell>
                  <TableCell>{t("actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category._id}>
                    <TableCell>{category._id}</TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.label}</TableCell>
                    <TableCell>
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.label}
                          style={{ width: 50, height: 50, objectFit: "cover" }}
                          onError={(e) => {
                            console.error(
                              `Failed to load image for category ${category.name}: ${category.image}`
                            );
                            e.target.alt = "Image not found";
                            e.target.style.display = "none";
                          }}
                          onLoad={() =>
                            console.log(
                              `Successfully loaded image for category ${category.name}: ${category.image}`
                            )
                          }
                        />
                      ) : (
                        "No Image"
                      )}
                    </TableCell>
                    <TableCell>
                      {category.createdAt
                        ? new Date(category.createdAt).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleOpenCategoryDialog(category)}
                        sx={{ marginRight: 1 }}
                      >
                        {t("edit")}
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDeleteCategory(category._id)}
                      >
                        {t("delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      {/* Диалог для добавления/редактирования категории */}
      <Dialog open={openCategoryDialog} onClose={handleCloseCategoryDialog}>
        <DialogTitle>
          {editingCategory ? t("edit_category") : t("add_category")}
        </DialogTitle>
        <DialogContent>
          <TextField
            label={t("name")}
            name="name"
            value={newCategory.name}
            onChange={handleCategoryChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label={t("label")}
            name="label"
            value={newCategory.label}
            onChange={handleCategoryChange}
            fullWidth
            margin="normal"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ marginTop: 16 }}
          />
          {editingCategory && editingCategory.image && (
            <Box sx={{ marginTop: 2 }}>
              <Typography variant="body2">{t("current_image")}:</Typography>
              <img
                src={editingCategory.image}
                alt="Current"
                style={{ width: 100, height: 100, objectFit: "cover" }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog} color="secondary">
            {t("cancel")}
          </Button>
          <Button onClick={handleSaveCategory} color="primary">
            {t("save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;
