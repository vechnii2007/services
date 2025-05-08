import { createApi } from "unsplash-js";

const unsplash = createApi({
  accessKey: process.env.REACT_APP_UNSPLASH_ACCESS_KEY,
});

export const getPhotosByQuery = async (query) => {
  try {
    const result = await unsplash.search.getPhotos({
      query,
      perPage: 1,
      orientation: "landscape",
    });

    if (result.errors) {
      console.error(
        "Error occurred while fetching Unsplash photos:",
        result.errors[0]
      );
      return null;
    }

    return result.response?.results[0]?.urls?.regular || null;
  } catch (error) {
    console.error("Failed to fetch photo from Unsplash:", error);
    return null;
  }
};

export const getCategoryPhoto = async (category) => {
  const queryMap = {
    healthcare: "medical hospital healthcare",
    education: "education school learning",
    finance: "finance business banking",
    household: "home repair maintenance",
    transport: "transport vehicle car",
    legal: "legal law office",
  };

  const query = queryMap[category] || category;
  return await getPhotosByQuery(query);
};
