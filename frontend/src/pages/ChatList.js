import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../constants";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
} from "@mui/material";

const ChatList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userRequests, setUserRequests] = useState([]);
  const [providerRequests, setProviderRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage(t("please_login"));
          navigate("/login");
          return;
        }

        // Получаем запросы, созданные пользователем
        const userRes = await axios.get(`/api/services/my-chats`);
        console.log("User requests:", userRes.data); // Добавляем лог
        setUserRequests(userRes.data);

        // Получаем запросы, на которые пользователь (поставщик) отправил предложения
        const providerRes = await axios.get(`/api/services/provider-chats`);
        console.log("Provider requests:", providerRes.data); // Добавляем лог
        setProviderRequests(providerRes.data);

        setMessage(t("requests_loaded"));
      } catch (error) {
        if (error.response) {
          setMessage(
            "Error: " + (error.response.data.error || t("something_went_wrong"))
          );
          if (error.response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
          }
        } else if (error.request) {
          setMessage(t("no_response_from_server"));
        } else {
          setMessage("Error: " + error.message);
        }
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [t, navigate]);

  if (loading) {
    return <Typography>{t("loading")}</Typography>;
  }

  return (
    <Box sx={{ paddingY: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t("chat_list")}
      </Typography>
      {message && (
        <Typography
          variant="body2"
          color="textSecondary"
          align="center"
          sx={{ marginBottom: 2 }}
        >
          {message}
        </Typography>
      )}

      <Typography variant="h6" gutterBottom>
        {t("my_requests")}
      </Typography>
      {userRequests.length > 0 ? (
        <Grid container spacing={3}>
          {userRequests.map((request) => (
            <Grid item xs={12} sm={6} md={4} key={request._id}>
              <Card>
                <CardContent>
                  <Typography variant="body1">
                    <strong>{t("service_type")}:</strong>{" "}
                    {t(request.serviceType)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>{t("location")}:</strong> {request.location}
                  </Typography>
                  <Typography variant="body1">
                    <strong>{t("description")}:</strong> {request.description}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to={`/chat/${request._id}`}
                    sx={{ marginTop: 2 }}
                  >
                    {t("chat")}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" align="center">
          {t("no_requests")}
        </Typography>
      )}

      <Typography variant="h6" gutterBottom sx={{ marginTop: 4 }}>
        {t("available_requests")}
      </Typography>
      {providerRequests.length > 0 ? (
        <Grid container spacing={3}>
          {providerRequests.map((request) => (
            <Grid item xs={12} sm={6} md={4} key={request._id}>
              <Card>
                <CardContent>
                  <Typography variant="body1">
                    <strong>{t("service_type")}:</strong>{" "}
                    {t(request.serviceType)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>{t("location")}:</strong> {request.location}
                  </Typography>
                  <Typography variant="body1">
                    <strong>{t("description")}:</strong> {request.description}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to={`/chat/${request._id}`}
                    sx={{ marginTop: 2 }}
                  >
                    {t("chat")}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" align="center">
          {t("no_requests")}
        </Typography>
      )}
    </Box>
  );
};

export default ChatList;
