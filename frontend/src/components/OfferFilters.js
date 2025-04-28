import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  TextField,
  Button,
  Autocomplete,
  InputAdornment,
  Paper,
  Chip,
  Collapse,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import TuneIcon from "@mui/icons-material/Tune";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import HistoryIcon from "@mui/icons-material/History";
import { motion, AnimatePresence } from "framer-motion";
import { searchService } from "../services/searchService";

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

// Ключ для localStorage
const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 5;

const OfferFilters = ({
  searchQuery,
  setSearchQuery,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  locationFilter,
  setLocationFilter,
  categories = [],
  selectedCategories = [],
  onCategoryChange,
  onSearch,
  isSearching = false,
}) => {
  const { t } = useTranslation();
  const searchRef = useRef(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularSearches, setPopularSearches] = useState([]);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [locations, setLocations] = useState([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);

  // Загружаем популярные поиски и локации при монтировании компонента
  useEffect(() => {
    loadPopularSearches();
    loadLocations();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Загрузка популярных поисков
  const loadPopularSearches = async () => {
    try {
      setIsLoadingPopular(true);
      const searches = await searchService.getPopularSearches(5);
      setPopularSearches(
        searches.map((search) => ({
          label: search.query,
          icon: getCategoryIcon(search.category),
          value: search.query,
          category: search.category,
        }))
      );
    } catch (error) {
      console.error("Error loading popular searches:", error);
    } finally {
      setIsLoadingPopular(false);
    }
  };

  // Загрузка локаций
  const loadLocations = async () => {
    try {
      const locationsList = await searchService.getLocations();
      setLocations(
        locationsList.map((location) => ({
          label: location,
          region: "",
        }))
      );
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  };

  // Получение иконки для категории
  const getCategoryIcon = (categoryName) => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.icon || "🔍";
  };

  // Сохраняем поисковый запрос в историю и на сервер
  const saveToRecentSearches = async (query) => {
    if (!query) return;

    // Сохраняем локально
    const newRecentSearches = [
      query,
      ...recentSearches.filter((item) => item !== query),
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(newRecentSearches);
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(newRecentSearches)
    );

    // Сохраняем на сервер
    try {
      const category =
        selectedCategories.length > 0 ? selectedCategories[0] : null;
      await searchService.saveSearchQuery(query, category);
    } catch (error) {
      console.error("Error saving search query:", error);
    }
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    saveToRecentSearches(searchQuery);
    if (onSearch) onSearch();
  };

  const handlePopularSearchClick = (search) => {
    setSearchQuery(search.label);
    if (search.category) {
      onCategoryChange?.(search.category);
    }
    setShowSuggestions(false);
    handleSearch();
  };

  const handleRecentSearchClick = (search) => {
    setSearchQuery(search);
    setShowSuggestions(false);
    handleSearch();
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <MotionPaper
      elevation={3}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 4,
        borderRadius: 2,
        background: "linear-gradient(to right, #ffffff, #f8f9fa)",
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 2.5, sm: 2 },
        }}
      >
        {/* Основной поиск */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 2 },
            alignItems: { sm: "center" },
          }}
        >
          <TextField
            fullWidth
            size="large"
            variant="outlined"
            placeholder={t("search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyPress={handleKeyPress}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: { xs: 1, sm: 0 } }}
          />
          <Autocomplete
            fullWidth
            size="large"
            options={locations}
            getOptionLabel={(option) => option.label || ""}
            value={locationFilter}
            onChange={(_, newValue) => setLocationFilter(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={t("location_placeholder")}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            sx={{ mb: { xs: 1, sm: 0 } }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 2 },
            alignItems: { sm: "center" },
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            startIcon={<TuneIcon />}
            sx={{ py: 1.5, fontSize: "1rem" }}
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            {t("filters")}
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ py: 1.5, fontSize: "1rem" }}
            onClick={handleSearch}
            disabled={isSearching}
          >
            {t("search")}
          </Button>
        </Box>

        {/* Выпадающие подсказки */}
        <AnimatePresence>
          {showSuggestions && (
            <MotionBox
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                mt: 1,
                p: 2,
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 3,
                zIndex: 1000,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <TrendingUpIcon fontSize="small" color="primary" />
                {t("popular_searches")}
                {isLoadingPopular && <CircularProgress size={16} />}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {popularSearches.map((search) => (
                  <Chip
                    key={search.value}
                    icon={<span>{search.icon}</span>}
                    label={search.label}
                    onClick={() => handlePopularSearchClick(search)}
                    sx={{
                      "&:hover": {
                        bgcolor: "primary.light",
                        color: "primary.contrastText",
                      },
                    }}
                  />
                ))}
              </Box>

              {recentSearches.length > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      my: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <HistoryIcon fontSize="small" color="action" />
                    {t("recent_searches")}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {recentSearches.map((search) => (
                      <Chip
                        key={search}
                        label={search}
                        variant="outlined"
                        size="small"
                        onClick={() => handleRecentSearchClick(search)}
                        onDelete={() => {
                          const newSearches = recentSearches.filter(
                            (s) => s !== search
                          );
                          setRecentSearches(newSearches);
                          localStorage.setItem(
                            RECENT_SEARCHES_KEY,
                            JSON.stringify(newSearches)
                          );
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </MotionBox>
          )}
        </AnimatePresence>

        {/* Выбранные категории */}
        <AnimatePresence>
          {selectedCategories.length > 0 && (
            <MotionBox
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
            >
              {selectedCategories.map((category) => (
                <Chip
                  key={category}
                  label={t(category)}
                  onDelete={() => onCategoryChange(category)}
                  color="primary"
                  variant="outlined"
                  sx={{
                    "&:hover": {
                      bgcolor: "primary.light",
                      color: "primary.contrastText",
                    },
                  }}
                />
              ))}
            </MotionBox>
          )}
        </AnimatePresence>

        {/* Расширенные фильтры */}
        <Collapse in={showAdvanced}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mt: 2,
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
            <TextField
              label={t("min_price")}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              type="number"
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
            />
            <TextField
              label={t("max_price")}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              type="number"
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
            />
          </Box>
        </Collapse>
      </Box>
    </MotionPaper>
  );
};

export default OfferFilters;
