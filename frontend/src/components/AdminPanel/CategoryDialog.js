import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from "@mui/material";

const CategoryDialog = ({
  open,
  onClose,
  category,
  newCategory,
  onCategoryChange,
  onImageChange,
  onSave,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {category ? t("edit_category") : t("add_category")}
      </DialogTitle>
      <DialogContent>
        <TextField
          label={t("name") + " (RU)"}
          name="name.ru"
          value={newCategory.name?.ru || ""}
          onChange={onCategoryChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t("name") + " (UK)"}
          name="name.uk"
          value={newCategory.name?.uk || ""}
          onChange={onCategoryChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t("name") + " (ES)"}
          name="name.es"
          value={newCategory.name?.es || ""}
          onChange={onCategoryChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t("label")}
          name="label"
          value={newCategory.label}
          onChange={onCategoryChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t("key") + " (slug)"}
          name="key"
          value={newCategory.key || ""}
          onChange={onCategoryChange}
          fullWidth
          margin="normal"
        />
        <input
          type="file"
          accept="image/*"
          onChange={onImageChange}
          style={{ marginTop: 16 }}
        />
        {category && category.image && (
          <Box sx={{ marginTop: 2 }}>
            <Typography variant="body2">{t("current_image")}:</Typography>
            <img
              src={category.image}
              alt="Current"
              style={{ width: 100, height: 100, objectFit: "cover" }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          {t("cancel")}
        </Button>
        <Button onClick={onSave} color="primary">
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryDialog;
