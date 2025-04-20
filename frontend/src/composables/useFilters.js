import { useState, useCallback } from 'react';

const useFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const getFilteredData = useCallback((data) => {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return item[key]?.toString().toLowerCase().includes(value.toString().toLowerCase());
      });
    });
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    getFilteredData,
  };
};

export default useFilters; 