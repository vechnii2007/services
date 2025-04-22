import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../middleware/api"; // Заменяем axios на api
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Chip,
  Divider,
  Paper,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import ChatIcon from "@mui/icons-material/Chat";
import CategoryIcon from "@mui/icons-material/Category";
import PendingIcon from "@mui/icons-material/Pending";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const getStatusIcon = (status) => {
  switch (status) {
    case "pending":
      return <PendingIcon color="warning" />;
    case "completed":
      return <CheckCircleIcon color="success" />;
    case "cancelled":
      return <CancelIcon color="error" />;
    default:
      return <PendingIcon />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "warning";
    case "completed":
      return "success";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

const MyRequests = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const isFetchingData = useRef(false); // Флаг для предотвращения дубликатов

  useEffect(() => {
    const fetchRequests = async () => {
      if (isFetchingData.current) {
        console.log("Fetch requests already in progress, skipping...");
        return;
      }

      isFetchingData.current = true;
      try {
        const res = await api.get("/services/my-requests");
        setRequests(res.data);
      } catch (error) {
        setError(
          "Error fetching requests: " +
            (error.response?.data?.error || error.message)
        );
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
        isFetchingData.current = false;
      }
    };
    fetchRequests();
  }, [navigate]);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6">{t("loading")}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1200, margin: "0 auto" }}>
      <Paper
        elevation={0}
        sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: "background.paper" }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 600, color: "primary.main" }}
        >
          {t("my_requests")}
        </Typography>
      </Paper>

      {requests.length > 0 ? (
        <Grid container spacing={3}>
          {requests.map((request) => (
            <Grid item xs={12} sm={6} md={4} key={request._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      icon={getStatusIcon(request.status)}
                      label={t(request.status)}
                      color={getStatusColor(request.status)}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <CategoryIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6" component="div">
                      {t(request.serviceType)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <LocationOnIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {request.location}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                      {t("description")}:
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {request.description}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <EventIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    component={Link}
                    to={`/chat/${request._id}`}
                    startIcon={<ChatIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      boxShadow: "none",
                      "&:hover": {
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      },
                    }}
                  >
                    {t("chat")}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" color="text.secondary">
            {t("no_requests")}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MyRequests;
