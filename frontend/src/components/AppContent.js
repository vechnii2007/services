import React, { useEffect, useContext, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Header from "./Header/index";
import SideMenu from "./SideMenu";
import RouteGuard from "../utils/RouteGuard";
import { routesConfig } from "../utils/routesConfig";
import { AuthContext } from "../context/AuthContext";

const AppContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, logout, isAuthenticated } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography>{t("loading")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header onDrawerToggle={toggleDrawer(true)} />
      <Box sx={{ display: "flex", flex: 1 }}>
        <SideMenu open={drawerOpen} onClose={toggleDrawer(false)} user={user} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: { xs: 7, sm: 8 }, // Отступ под фиксированным хедером
            width: "100%",
            maxWidth: "100%",
            overflowX: "hidden",
          }}
        >
          <Routes>
            <Route
              path="/"
              element={<Typography>{t("welcome_message")}</Typography>}
            />
            {routesConfig.map(({ path, element, requiredRole }) => (
              <Route
                key={path}
                path={path}
                element={
                  requiredRole ? (
                    <RouteGuard user={user} requiredRole={requiredRole}>
                      {element}
                    </RouteGuard>
                  ) : (
                    element
                  )
                }
              />
            ))}
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default AppContent;
