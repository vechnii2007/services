import React from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Paper,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  Create as CreateIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";

const FeatureCard = ({ icon: Icon, title, description }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        backgroundColor: "background.paper",
        borderRadius: 2,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Icon
        sx={{
          fontSize: 48,
          color: "primary.main",
          mb: 2,
        }}
      />
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
};

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      icon: SearchIcon,
      title: t("find_services"),
      description: t("find_services_description"),
    },
    {
      icon: CreateIcon,
      title: t("create_offers"),
      description: t("create_offers_description"),
    },
    {
      icon: SecurityIcon,
      title: t("secure_platform"),
      description: t("secure_platform_description"),
    },
    {
      icon: SpeedIcon,
      title: t("fast_response"),
      description: t("fast_response_description"),
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
          color: "white",
          py: { xs: 8, md: 12 },
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                }}
              >
                {t("welcome_title")}
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                {t("welcome_subtitle")}
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/offers")}
                  sx={{
                    backgroundColor: "white",
                    color: "primary.main",
                    "&:hover": {
                      backgroundColor: "grey.100",
                    },
                  }}
                >
                  {t("browse_services")}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/create-request")}
                  sx={{
                    borderColor: "white",
                    color: "white",
                    "&:hover": {
                      borderColor: "grey.100",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  {t("create_request")}
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              {/* Здесь можно добавить иллюстрацию */}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{ mb: 6, fontWeight: 600 }}
        >
          {t("our_features")}
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <FeatureCard {...feature} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
