import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  TextField,
  Button,
  IconButton,
  Autocomplete,
  MenuItem,
  Chip,
  Collapse,
  Paper,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  Save as SaveIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

const sortOptions = [
  { value: "newest", label: "newest" },
  { value: "price_asc", label: "price_low_to_high" },
  { value: "price_desc", label: "price_high_to_low" },
  { value: "rating", label: "by_rating" },
];

const MotionPaper = motion(Paper);

const OfferFilters = ({
  searchQuery,
  setSearchQuery,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  locationFilter,
  setLocationFilter,
  sortBy,
  setSortBy,
  onClearFilters,
}) => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [locations, setLocations] = useState([]);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Загрузка сохраненных локаций из localStorage
  useEffect(() => {
    const savedLocations = localStorage.getItem("recentLocations");
    if (savedLocations) {
      setLocations(JSON.parse(savedLocations));
    }
  }, []);

  // Подсчет активных фильтров
  useEffect(() => {
    let count = 0;
    if (searchQuery) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (locationFilter) count++;
    if (sortBy) count++;
    setActiveFiltersCount(count);
  }, [searchQuery, minPrice, maxPrice, locationFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setLocationFilter("");
    setSortBy("");
    if (onClearFilters) onClearFilters();
  };

  const handleSaveFilters = () => {
    const filters = {
      searchQuery,
      minPrice,
      maxPrice,
      locationFilter,
      sortBy,
    };
    localStorage.setItem("savedFilters", JSON.stringify(filters));
  };

  const handleLocationSelect = (value) => {
    setLocationFilter(value);
    if (value && !locations.includes(value)) {
      const newLocations = [value, ...locations.slice(0, 4)];
      setLocations(newLocations);
      localStorage.setItem("recentLocations", JSON.stringify(newLocations));
    }
  };

  return (
    <MotionPaper
      elevation={2}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        p: 2,
        mb: 4,
        borderRadius: "16px",
        backgroundColor: "background.paper",
      }}
    >
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {/* Основной поиск */}
        <TextField
          fullWidth
          label={t("search_placeholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
            ),
            sx: { borderRadius: "12px" },
          }}
          sx={{ flex: { xs: "1 1 100%", md: "1 1 auto" } }}
        />

        {/* Сортировка */}
        <TextField
          select
          label={t("sort_by")}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <SortIcon sx={{ color: "text.secondary", mr: 1 }} />
            ),
            sx: { borderRadius: "12px" },
          }}
          sx={{ width: { xs: "100%", md: "200px" } }}
        >
          {sortOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {t(option.label)}
            </MenuItem>
          ))}
        </TextField>

        {/* Кнопки управления фильтрами */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant={showFilters ? "contained" : "outlined"}
            onClick={() => setShowFilters(!showFilters)}
            startIcon={<FilterListIcon />}
            sx={{
              borderRadius: "12px",
              whiteSpace: "nowrap",
            }}
          >
            {t("filters")}
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                sx={{
                  ml: 1,
                  height: "20px",
                  backgroundColor: showFilters
                    ? "primary.light"
                    : "primary.main",
                  color: "white",
                }}
              />
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <IconButton
              onClick={handleClearFilters}
              size="small"
              sx={{
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <ClearIcon />
            </IconButton>
          )}

          <IconButton
            onClick={handleSaveFilters}
            size="small"
            sx={{
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <SaveIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Расширенные фильтры */}
      <Collapse in={showFilters}>
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          sx={{
            mt: 2,
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <TextField
            label={t("min_price")}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            type="number"
            variant="outlined"
            InputProps={{
              sx: { borderRadius: "12px" },
            }}
            sx={{ width: { xs: "100%", sm: "calc(50% - 8px)", md: "200px" } }}
          />

          <TextField
            label={t("max_price")}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            type="number"
            variant="outlined"
            InputProps={{
              sx: { borderRadius: "12px" },
            }}
            sx={{ width: { xs: "100%", sm: "calc(50% - 8px)", md: "200px" } }}
          />

          <Autocomplete
            freeSolo
            options={locations}
            value={locationFilter}
            onChange={(_, value) => handleLocationSelect(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("location")}
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <LocationIcon sx={{ color: "text.secondary", mr: 1 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  sx: { borderRadius: "12px" },
                }}
              />
            )}
            sx={{ width: { xs: "100%", md: "300px" } }}
          />
        </Box>
      </Collapse>
    </MotionPaper>
  );
};

export default OfferFilters;
