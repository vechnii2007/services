import React from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import TranslateIcon from "@mui/icons-material/Translate";
import PaymentsIcon from "@mui/icons-material/Payments";
import StarIcon from "@mui/icons-material/Star";

// Анимированные компоненты
const MotionBox = styled(motion.div)({});
const MotionCard = styled(motion(Card))({});

// Стили
const FeatureContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(10, 2),
  background: theme.palette.background.paper,
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(12, 4),
  },
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: "100%",
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  boxShadow: "0 5px 20px rgba(0, 0, 0, 0.05)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
  },
}));

const FeatureIcon = styled(Box)(({ theme, color = "primary.main" }) => ({
  width: 60,
  height: 60,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing(2),
  backgroundColor:
    theme.palette[color.split(".")[0]][color.split(".")[1] || "main"] + "15", // 15% opacity
  color: theme.palette[color.split(".")[0]][color.split(".")[1] || "main"],
}));

const FeatureSection = () => {
  const { t } = useTranslation();

  // Вариации для анимации
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
      },
    },
  };

  // Список функций
  const features = [
    {
      icon: <SearchIcon fontSize="large" />,
      title: "landing.features.search.title",
      description: "landing.features.search.description",
      color: "primary.main",
    },
    {
      icon: <SecurityIcon fontSize="large" />,
      title: "landing.features.security.title",
      description: "landing.features.security.description",
      color: "error.main",
    },
    {
      icon: <TranslateIcon fontSize="large" />,
      title: "landing.features.multilingual.title",
      description: "landing.features.multilingual.description",
      color: "info.main",
    },
    {
      icon: <PaymentsIcon fontSize="large" />,
      title: "landing.features.payments.title",
      description: "landing.features.payments.description",
      color: "success.main",
    },
    {
      icon: <SupportAgentIcon fontSize="large" />,
      title: "landing.features.support.title",
      description: "landing.features.support.description",
      color: "warning.main",
    },
    {
      icon: <StarIcon fontSize="large" />,
      title: "landing.features.ratings.title",
      description: "landing.features.ratings.description",
      color: "secondary.main",
    },
  ];

  return (
    <FeatureContainer component="section">
      <Container maxWidth="lg">
        <MotionBox
          sx={{ textAlign: "center", mb: 8 }}
          variants={titleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Typography
            variant="overline"
            color="primary"
            fontWeight={600}
            sx={{ letterSpacing: 2, mb: 1, display: "block" }}
          >
            {t("landing.features.overline")}
          </Typography>
          <Typography
            variant="h2"
            component="h2"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            {t("landing.features.title")}
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              maxWidth: "800px",
              mx: "auto",
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            {t("landing.features.subtitle")}
          </Typography>
        </MotionBox>

        <MotionBox
          component={Grid}
          container
          spacing={4}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <MotionCard component={FeatureCard} variants={itemVariants}>
                <CardContent sx={{ p: 0 }}>
                  <FeatureIcon color={feature.color}>
                    {feature.icon}
                  </FeatureIcon>
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    fontWeight={600}
                    sx={{ mb: 1.5 }}
                  >
                    {t(feature.title)}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7 }}
                  >
                    {t(feature.description)}
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </MotionBox>
      </Container>
    </FeatureContainer>
  );
};

export default FeatureSection;
