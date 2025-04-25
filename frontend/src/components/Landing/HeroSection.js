import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  useMediaQuery,
  useTheme,
  Paper,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import HandymanIcon from "@mui/icons-material/Handyman";
import SpainIcon from "@mui/icons-material/LocationOn";

// Анимированные компоненты
const MotionBox = styled(motion.div)({});
const MotionTypography = styled(motion.div)({});
const MotionButton = styled(motion(Button))({});

// Стилизованные компоненты
const HeroContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  position: "relative",
  alignItems: "center",
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 55%, ${theme.palette.secondary.light} 100%)`,
  overflow: "hidden",
  padding: theme.spacing(6, 2),
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(8),
  },
}));

const GradientText = styled(Typography)(({ theme }) => ({
  background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.light})`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  display: "inline-block",
  fontWeight: 800,
}));

const FloatingCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  backgroundColor: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  maxWidth: "100%",
  [theme.breakpoints.up("md")]: {
    maxWidth: 500,
  },
}));

const CircleDecoration = styled(Box)(
  ({
    theme,
    color = "primary.main",
    size = 300,
    top,
    right,
    bottom,
    left,
    opacity = 0.2,
  }) => ({
    position: "absolute",
    width: size,
    height: size,
    borderRadius: "50%",
    backgroundColor:
      theme.palette[color.split(".")[0]][color.split(".")[1] || "main"],
    opacity,
    top,
    right,
    bottom,
    left,
    zIndex: 0,
    filter: "blur(60px)",
  })
);

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // Анимации
  const titleVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.3,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay: 0.6,
      },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.2,
      },
    },
  };

  // Функция перехода к поиску предложений
  const handleExploreClick = () => {
    navigate("/offers");
  };

  // Функция для создания нового предложения
  const handleProvideClick = () => {
    navigate("/create-offer");
  };

  return (
    <HeroContainer component="section">
      {/* Декоративные элементы */}
      <CircleDecoration
        color="primary.light"
        size={450}
        top="-15%"
        right="-10%"
        opacity={0.15}
      />
      <CircleDecoration
        color="secondary.main"
        size={350}
        bottom="-10%"
        left="-5%"
        opacity={0.1}
      />
      <CircleDecoration
        color="primary.dark"
        size={200}
        top="30%"
        right="20%"
        opacity={0.07}
      />

      <Container maxWidth="xl">
        <Grid
          container
          spacing={4}
          alignItems="center"
          justifyContent="space-between"
        >
          <Grid item xs={12} md={6}>
            <Box sx={{ position: "relative", zIndex: 2 }}>
              <MotionTypography
                variants={titleVariants}
                initial="hidden"
                animate="visible"
              >
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: {
                      xs: "2.5rem",
                      sm: "3rem",
                      md: "3.5rem",
                      lg: "4rem",
                    },
                    color: "white",
                    mb: 2,
                    textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  {t("landing.hero.title.part1")}{" "}
                  <GradientText
                    component="span"
                    sx={{
                      fontSize: "inherit",
                      fontWeight: "inherit",
                    }}
                  >
                    {t("landing.hero.title.highlight")}
                  </GradientText>{" "}
                  {t("landing.hero.title.part2")}
                </Typography>
              </MotionTypography>

              <MotionTypography
                variants={subtitleVariants}
                initial="hidden"
                animate="visible"
              >
                <Typography
                  variant="h5"
                  color="white"
                  sx={{
                    mb: 4,
                    fontWeight: 400,
                    opacity: 0.9,
                    maxWidth: "600px",
                    lineHeight: 1.5,
                  }}
                >
                  {t("landing.hero.subtitle")}
                </Typography>
              </MotionTypography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                }}
              >
                <MotionButton
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  component={Button}
                  variant="contained"
                  size="large"
                  color="secondary"
                  startIcon={<SearchIcon />}
                  onClick={handleExploreClick}
                  sx={{
                    borderRadius: "50px",
                    py: 1.5,
                    px: 4,
                    fontWeight: 600,
                    fontSize: "1rem",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                    color: "white",
                  }}
                >
                  {t("landing.hero.find_button")}
                </MotionButton>

                <MotionButton
                  variants={buttonVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  component={Button}
                  variant="outlined"
                  size="large"
                  startIcon={<HandymanIcon />}
                  onClick={handleProvideClick}
                  sx={{
                    borderRadius: "50px",
                    py: 1.5,
                    px: 4,
                    fontWeight: 600,
                    fontSize: "1rem",
                    borderWidth: 2,
                    borderColor: "white",
                    color: "white",
                    "&:hover": {
                      borderWidth: 2,
                      borderColor: "white",
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  {t("landing.hero.provide_button")}
                </MotionButton>
              </Box>
            </Box>
          </Grid>

          <Grid
            item
            xs={12}
            md={5}
            sx={{
              display: { xs: "none", md: "block" },
              position: "relative",
              zIndex: 2,
            }}
          >
            <MotionBox
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <FloatingCard elevation={6}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 1,
                  }}
                >
                  <SpainIcon color="primary" fontSize="large" />
                  <Typography
                    variant="h5"
                    fontWeight={600}
                    color="text.primary"
                  >
                    {t("landing.hero.card.title")}
                  </Typography>
                </Box>

                <Typography variant="body1" color="text.secondary" paragraph>
                  {t("landing.hero.card.description")}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  {["Español", "Українська", "Русский"].map((language) => (
                    <Chip
                      key={language}
                      label={language}
                      size="small"
                      color={language === "Español" ? "primary" : "default"}
                      sx={{
                        borderRadius: "50px",
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleExploreClick}
                    sx={{
                      borderRadius: "50px",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    {t("landing.hero.card.button")}
                  </Button>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontStyle: "italic",
                      opacity: 0.7,
                    }}
                  >
                    {t("landing.hero.card.users_count")}
                  </Typography>
                </Box>
              </FloatingCard>
            </MotionBox>
          </Grid>
        </Grid>
      </Container>
    </HeroContainer>
  );
};

export default HeroSection;
