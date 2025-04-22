export const filterOffers = (
  offers,
  { searchQuery, selectedCategory, minPrice, maxPrice, locationFilter, sortBy }
) => {
  let filteredOffers = offers.filter((offer) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesServiceType = offer.serviceType
      ?.toLowerCase()
      .includes(searchLower);
    const matchesDescription =
      offer.description?.toLowerCase().includes(searchLower) || false;
    const matchesSearch = searchQuery
      ? matchesServiceType || matchesDescription
      : true;
    const matchesCategory = selectedCategory
      ? offer.serviceType === selectedCategory
      : true;
    const matchesMinPrice = minPrice ? offer.price >= Number(minPrice) : true;
    const matchesMaxPrice = maxPrice ? offer.price <= Number(maxPrice) : true;
    const matchesLocation = locationFilter
      ? offer.location?.toLowerCase().includes(locationFilter.toLowerCase())
      : true;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesLocation
    );
  });

  // Сортировка результатов
  if (sortBy) {
    filteredOffers.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });
  }

  return filteredOffers;
};
