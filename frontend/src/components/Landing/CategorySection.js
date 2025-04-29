import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  LinearProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import HealthcareIcon from "@mui/icons-material/HealthAndSafety";
import EducationIcon from "@mui/icons-material/School";
import FinanceIcon from "@mui/icons-material/AccountBalance";
import HouseholdIcon from "@mui/icons-material/HomeWork";
import TransportIcon from "@mui/icons-material/DirectionsCar";
import LegalIcon from "@mui/icons-material/Gavel";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { alpha } from "@mui/material/styles";

// Анимированные компоненты
const MotionBox = styled(motion.div)({});
const MotionCard = styled(motion(Card))({});

// Стилизованные компоненты
const CategoryContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(10, 2),
  background: theme.palette.background.default,
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(12, 4),
  },
}));

const CategoryCard = styled(Card)(({ theme }) => ({
  height: "100%",
  borderRadius: theme.spacing(2),
  overflow: "hidden",
  boxShadow: "0 5px 15px rgba(0, 0, 0, 0.05)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  background: theme.palette.background.paper,
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: "0 12px 25px rgba(0, 0, 0, 0.1)",
    "& .category-image": {
      transform: "scale(1.1)",
    },
    "& .category-overlay": {
      opacity: 0.7,
    },
  },
}));

const CardImageWrapper = styled(Box)(({ theme }) => ({
  height: 200,
  overflow: "hidden",
  position: "relative",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)",
    opacity: 0.5,
    transition: "opacity 0.3s ease",
  },
  "& .category-image": {
    transition: "transform 0.3s ease",
    height: "100%",
    width: "100%",
    objectFit: "cover",
  },
  "& .category-overlay": {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: (props) =>
      `linear-gradient(135deg, ${alpha(
        theme.palette[props.color?.split(".")[0]][
          props.color?.split(".")[1] || "main"
        ],
        0.4
      )} 0%, ${alpha(theme.palette.background.default, 0.1)} 100%)`,
    opacity: 0,
    transition: "opacity 0.3s ease",
    zIndex: 1,
  },
}));

const IconBox = styled(Box)(({ theme, color = "primary.main" }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 64,
  height: 64,
  borderRadius: "50%",
  marginBottom: theme.spacing(2),
  backgroundColor: alpha(
    theme.palette[color.split(".")[0]][color.split(".")[1] || "main"],
    0.15
  ),
  color: theme.palette[color.split(".")[0]][color.split(".")[1] || "main"],
  transition: "transform 0.3s ease, background-color 0.3s ease",
  "& svg": {
    fontSize: 32,
    transition: "transform 0.3s ease",
  },
  "&:hover": {
    transform: "scale(1.1)",
    backgroundColor: alpha(
      theme.palette[color.split(".")[0]][color.split(".")[1] || "main"],
      0.2
    ),
    "& svg": {
      transform: "scale(1.1)",
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1, 3),
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": {
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
}));

const StatsBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1, 0),
}));

const PopularityBar = styled(LinearProgress)(({ theme }) => ({
  height: 6,
  borderRadius: 3,
  width: "100%",
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  "& .MuiLinearProgress-bar": {
    borderRadius: 3,
  },
}));

const ServiceChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
  },
}));

const CategorySection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Вариации для анимации
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  // Список категорий
  const categories = [
    {
      id: "healthcare",
      name: t("landing.categories.healthcare"),
      icon: <HealthcareIcon fontSize="large" />,
      color: "primary.main",
      image: "https://source.unsplash.com/random/400x300/?medicine",
      servicesCount: 245,
      popularity: 85,
      examples: ["Терапевт", "Стоматолог", "Массаж"],
    },
    {
      id: "education",
      name: t("landing.categories.education"),
      icon: <EducationIcon fontSize="large" />,
      color: "info.main",
      image: "https://source.unsplash.com/random/400x300/?education",
      servicesCount: 189,
      popularity: 75,
      examples: ["Репетитор", "Языковые курсы", "Программирование"],
    },
    {
      id: "finance",
      name: t("landing.categories.finance"),
      icon: <FinanceIcon fontSize="large" />,
      color: "success.main",
      image: "https://source.unsplash.com/random/400x300/?finance",
      servicesCount: 156,
      popularity: 70,
      examples: ["Бухгалтер", "Финансовый консультант", "Аудитор"],
    },
    {
      id: "household",
      name: t("landing.categories.household"),
      icon: <HouseholdIcon fontSize="large" />,
      color: "warning.main",
      image: "https://source.unsplash.com/random/400x300/?home",
      servicesCount: 312,
      popularity: 90,
      examples: ["Уборка", "Ремонт", "Сантехник"],
    },
    {
      id: "transport",
      name: t("landing.categories.transport"),
      icon: <TransportIcon fontSize="large" />,
      color: "error.main",
      image: "https://source.unsplash.com/random/400x300/?transport",
      servicesCount: 134,
      popularity: 65,
      examples: ["Такси", "Грузоперевозки", "Эвакуатор"],
    },
    {
      id: "legal",
      name: t("landing.categories.legal"),
      icon: <LegalIcon fontSize="large" />,
      color: "secondary.main",
      image: "https://source.unsplash.com/random/400x300/?legal",
      servicesCount: 167,
      popularity: 60,
      examples: ["Юрист", "Нотариус", "Адвокат"],
    },
  ];

  const handleCategoryClick = (category) => {
    navigate(`/offers?category=${category.id}`);
  };

  return (
    <CategoryContainer component="section">
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
            {t("landing.categories.overline")}
          </Typography>
          <Typography
            variant="h2"
            component="h2"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            {t("landing.categories.title")}
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ maxWidth: "800px", mx: "auto", lineHeight: 1.6 }}
          >
            {t("landing.categories.subtitle")}
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
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <MotionCard
                component={CategoryCard}
                variants={itemVariants}
                onClick={() => handleCategoryClick(category)}
              >
                <CardImageWrapper color={category.color}>
                  <CardMedia
                    component="img"
                    className="category-image"
                    image={category.image}
                    alt={category.name}
                  />
                  <Box className="category-overlay" />
                </CardImageWrapper>
                <CardContent
                  sx={{
                    textAlign: "center",
                    p: 3,
                    position: "relative",
                    "&:last-child": { pb: 5 },
                  }}
                >
                  <IconBox color={category.color}>{category.icon}</IconBox>
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    fontWeight={600}
                    sx={{
                      mb: 1,
                      color: "text.primary",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {category.name}
                  </Typography>

                  <StatsBox>
                    <Tooltip
                      title={t("landing.categories.services_count", {
                        count: category.servicesCount,
                      })}
                      arrow
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LocalOfferIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {t("landing.categories.services_count", {
                            count: category.servicesCount,
                          })}
                        </Typography>
                      </Box>
                    </Tooltip>

                    <Tooltip
                      title={`${t("landing.categories.popularity")}: ${
                        category.popularity
                      }%`}
                      arrow
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          ml: 2,
                        }}
                      >
                        <TrendingUpIcon fontSize="small" color="primary" />
                        <PopularityBar
                          variant="determinate"
                          value={category.popularity}
                          sx={{ width: 60 }}
                        />
                      </Box>
                    </Tooltip>
                  </StatsBox>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      opacity: 0.8,
                      transition: "opacity 0.3s ease",
                    }}
                  >
                    {t("landing.categories.service_examples", {
                      examples: category.examples.join(", "),
                    })}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: 0.5,
                      mb: 3,
                    }}
                  >
                    {category.examples.map((example, index) => (
                      <ServiceChip
                        key={index}
                        label={example}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/offers?category=${category.id}&query=${example}`
                          );
                        }}
                      />
                    ))}
                  </Box>

                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 16,
                      left: 0,
                      right: 0,
                      display: "flex",
                      justifyContent: "center",
                      transform: "translateY(0)",
                      transition: "transform 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <StyledButton
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={category.icon}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryClick(category);
                      }}
                    >
                      {t("landing.categories.explore_category")}
                    </StyledButton>
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </MotionBox>
      </Container>
    </CategoryContainer>
  );
};

export default CategorySection;
