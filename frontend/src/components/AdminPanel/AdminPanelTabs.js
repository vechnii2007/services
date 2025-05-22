import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, Tabs, Tab, Button, Snackbar } from "@mui/material";
import UsersTab from "./UsersTab";
import RequestsTab from "./RequestsTab";
import OffersTab from "./OffersTab";
import CategoriesTab from "./CategoriesTab";
import AdminService from "../../services/AdminService";
import TariffsTab from "./TariffsTab";
import PaymentsTab from "./PaymentsTab";

const AdminPanelTabs = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClearCache = async () => {
    try {
      await AdminService.clearCache();
      setCacheCleared(true);
    } catch (e) {
      alert("Не удалось очистить кэш через сервер.");
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          {t("admin_panel")}
        </Typography>
        <Button variant="outlined" color="secondary" onClick={handleClearCache}>
          Очистить кэш у всех пользователей
        </Button>
      </Box>
      <Tabs
        value={tabValue}
        onChange={handleChangeTab}
        sx={{ marginBottom: 4 }}
      >
        <Tab label={t("users")} />
        <Tab label={t("requests")} />
        <Tab label={t("offers")} />
        <Tab label={t("categories")} />
        <Tab label={t("tariffs")} />
        <Tab label={t("payments")} />
      </Tabs>

      {tabValue === 0 && <UsersTab />}
      {tabValue === 1 && <RequestsTab />}
      {tabValue === 2 && <OffersTab />}
      {tabValue === 3 && <CategoriesTab />}
      {tabValue === 4 && <TariffsTab />}
      {tabValue === 5 && <PaymentsTab />}

      <Snackbar
        open={cacheCleared}
        autoHideDuration={3000}
        onClose={() => setCacheCleared(false)}
        message="Кэш успешно очищен у всех пользователей!"
      />
    </Box>
  );
};

export default AdminPanelTabs;
