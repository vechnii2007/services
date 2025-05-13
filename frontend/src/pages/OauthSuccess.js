import { useEffect } from "react";

const OauthSuccess = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) localStorage.setItem("token", token);
    setTimeout(() => {
      window.location.replace("/offers");
    }, 300);
  }, []);
  return null;
};

export default OauthSuccess;
