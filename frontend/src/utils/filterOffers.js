import { getCategoryDisplayName } from "../helpers/category";

export const filterOffers = (offers, { searchQuery }) => {
  if (!searchQuery) return offers;

  return offers.filter((offer) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesServiceType = getCategoryDisplayName(offer.serviceType, "ru")
      .toLowerCase()
      .includes(searchLower);
    const matchesDescription =
      offer.description?.toLowerCase().includes(searchLower) || false;
    return matchesServiceType || matchesDescription;
  });
};
