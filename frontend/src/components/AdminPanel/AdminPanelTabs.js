import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Snackbar,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import UsersTab from "./UsersTab";
import RequestsTab from "./RequestsTab";
import OffersTab from "./OffersTab";
import CategoriesTab from "./CategoriesTab";
import AdminService from "../../services/AdminService";
import TariffsTab from "./TariffsTab";
import PaymentsTab from "./PaymentsTab";
import AdminRoleLimitsTab from "./AdminRoleLimitsTab";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";

const AdminPanelTabs = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [cacheCleared, setCacheCleared] = useState(false);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));

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
    <Box sx={{ padding: isMobile ? 2 : 4 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          mb: 2,
          gap: isMobile ? 2 : 0,
        }}
      >
        <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
          {t("admin_panel")}
        </Typography>
        <Tooltip
          title={
            t("clear_cache_all_users") || "Очистить кэш у всех пользователей"
          }
        >
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleClearCache}
            size={isMobile ? "small" : "medium"}
            startIcon={<DeleteSweepIcon />}
            sx={isMobile ? { alignSelf: "flex-end", width: "100%" } : {}}
          >
            {isMobile
              ? t("clear_cache") || "Очистить кэш"
              : t("clear_cache_all_users") ||
                "Очистить кэш у всех пользователей"}
          </Button>
        </Tooltip>
      </Box>
      <Tabs
        value={tabValue}
        onChange={handleChangeTab}
        sx={{ marginBottom: 4 }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab label={t("users")} sx={{ textAlign: "center" }} />
        <Tab label={t("requests")} sx={{ textAlign: "center" }} />
        <Tab label={t("offers")} sx={{ textAlign: "center" }} />
        <Tab label={t("categories")} sx={{ textAlign: "center" }} />
        <Tab label={t("tariffs")} sx={{ textAlign: "center" }} />
        <Tab label={t("payments")} sx={{ textAlign: "center" }} />
        <Tab label={t("limits", "Лимиты")} sx={{ textAlign: "center" }} />
      </Tabs>

      {tabValue === 0 && <UsersTab />}
      {tabValue === 1 && <RequestsTab />}
      {tabValue === 2 && <OffersTab />}
      {tabValue === 3 && <CategoriesTab />}
      {tabValue === 4 && <TariffsTab />}
      {tabValue === 5 && <PaymentsTab />}
      {tabValue === 6 && <AdminRoleLimitsTab />}

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
