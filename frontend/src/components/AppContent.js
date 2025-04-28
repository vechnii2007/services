import React, { useContext, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Header from "./Header/index";
import SideMenu from "./SideMenu";
import RouteGuard from "../utils/RouteGuard";
import { routesConfig } from "../utils/routesConfig";
import { AuthContext } from "../context/AuthContext";

const AppContent = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Определяем, находимся ли на лендинге
  const isLandingPage = location.pathname === "/";

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
      {/* Отображаем хедер только если не находимся на лендинге */}
      {!isLandingPage && <Header onDrawerToggle={toggleDrawer(true)} />}

      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Отображаем сайдбар только если не находимся на лендинге */}
        {!isLandingPage && (
          <SideMenu
            open={drawerOpen}
            onClose={toggleDrawer(false)}
            user={user}
          />
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: isLandingPage ? 0 : 3, // Убираем отступы для лендинга
            mt: isLandingPage ? 0 : { xs: 8, sm: 9 }, // Увеличен отступ от хедера
            width: "100%",
            maxWidth: "100%",
            overflowX: "hidden",
          }}
        >
          <Routes>
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
