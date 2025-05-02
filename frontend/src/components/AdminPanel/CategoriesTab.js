import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../../utils/axiosConfig";
import { Typography, Button, TableRow, TableCell, Box } from "@mui/material";
import GenericTable from "./GenericTable";
import CategoryDialog from "./CategoryDialog";

const CategoriesTab = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    label: "",
    image: null,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/admin/categories");
        setCategories(res.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

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

      if (editingCategory) {
        const res = await axios.put(
          `/admin/categories/${editingCategory._id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        setCategories(
          categories.map((cat) =>
            cat._id === editingCategory._id ? res.data : cat
          )
        );
      } else {
        const res = await axios.post("/admin/categories", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setCategories([...categories, res.data]);
      }
      handleCloseCategoryDialog();
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm(t("confirm_delete_category"))) {
      try {
        await axios.delete(`/admin/categories/${categoryId}`);
        setCategories(categories.filter((cat) => cat._id !== categoryId));
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const headers = [
    "ID",
    t("name"),
    t("label"),
    t("image"),
    t("created_at"),
    t("actions"),
  ];

  const renderRow = (category) => (
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
  );

  return (
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
      <GenericTable headers={headers} rows={categories} renderRow={renderRow} />
      <CategoryDialog
        open={openCategoryDialog}
        onClose={handleCloseCategoryDialog}
        category={editingCategory}
        newCategory={newCategory}
        onCategoryChange={handleCategoryChange}
        onImageChange={handleImageChange}
        onSave={handleSaveCategory}
      />
    </Box>
  );
};

export default CategoriesTab;
