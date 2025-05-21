import React from "react";
import { Box, Typography, Container, Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import CategoryCard from "./CategoryCard";

const CategoriesContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 0, 4, 0),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(4),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  marginBottom: theme.spacing(3),
  position: "relative",
  paddingLeft: theme.spacing(2),
  "&:after": {
    content: '""',
    position: "absolute",
    bottom: -8,
    left: theme.spacing(2),
    width: 60,
    height: 4,
    backgroundColor: theme.palette.primary.main,
    borderRadius: 2,
  },
}));

const Categories = ({
  categories = [],
  selectedCategory = null,
  onCategorySelect = () => {},
  counts = {},
  title = "categories",
}) => {
  const { t } = useTranslation();

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <CategoriesContainer>
      <Container maxWidth="lg">
        <SectionTitle variant="h5">{t(title)}</SectionTitle>
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={category.key || category._id}
            >
              <CategoryCard
                category={category}
                selected={selectedCategory === category.key}
                onClick={() => onCategorySelect(category)}
                count={counts[category.key] || 0}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </CategoriesContainer>
  );
};

Categories.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string,
      image: PropTypes.string,
      description: PropTypes.string,
    })
  ),
  selectedCategory: PropTypes.string,
  onCategorySelect: PropTypes.func,
  counts: PropTypes.object,
  title: PropTypes.string,
};

export default Categories;
