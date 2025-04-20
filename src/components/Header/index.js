import { useState } from "react";

const Header = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleSearch(searchQuery);
    } catch (err) {
      console.error("Search error:", err);
    }
  };
};
