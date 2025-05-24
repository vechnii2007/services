import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Stack,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material";
import AdminUserService from "../../services/AdminUserService";
import PaymentService from "../../services/PaymentService";
import { useTranslation } from "react-i18next";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import LaunchIcon from "@mui/icons-material/Launch";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ReplayIcon from "@mui/icons-material/Replay";
import LinkIcon from "@mui/icons-material/Link";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import PersonIcon from "@mui/icons-material/Person";

const TABS = [
  { label: "Заявки", value: "requests" },
  { label: "Предложения", value: "offers" },
  { label: "Платежи", value: "payments" },
  { label: "Подписки", value: "subscriptions" },
  { label: "Отзывы", value: "reviews" },
];

const AdminUserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [tab, setTab] = useState("requests");
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState(null);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    payment: null,
  });
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusMenuRequest, setStatusMenuRequest] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    request: null,
  });
  const [offerStatusMenuAnchor, setOfferStatusMenuAnchor] = useState(null);
  const [offerStatusMenuOffer, setOfferStatusMenuOffer] = useState(null);
  const [deleteOfferDialog, setDeleteOfferDialog] = useState({
    open: false,
    offer: null,
  });
  const [topLoading, setTopLoading] = useState(null);
  const [refundDialog, setRefundDialog] = useState({
    open: false,
    payment: null,
  });
  const [refundLoading, setRefundLoading] = useState(null);
  const [deleteSubscriptionDialog, setDeleteSubscriptionDialog] = useState({
    open: false,
    subscription: null,
  });
  const [renewDialog, setRenewDialog] = useState({
    open: false,
    subscription: null,
  });
  const [renewLoading, setRenewLoading] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(null);
  const [deleteReviewDialog, setDeleteReviewDialog] = useState({
    open: false,
    review: null,
  });
  const [reviewActionLoading, setReviewActionLoading] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    setError(null);
    AdminUserService.getFullProfile(id)
      .then(({ user, summary }) => {
        setUser(user);
        setSummary(summary);
      })
      .catch((e) => {
        setError(e.message || "Ошибка загрузки профиля пользователя");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === "requests") {
      setRequestsLoading(true);
      setRequestsError(null);
      AdminUserService.getUserRequests(id)
        .then((data) => setRequests(Array.isArray(data) ? data : []))
        .catch((e) => setRequestsError(e.message || "Ошибка загрузки заявок"))
        .finally(() => setRequestsLoading(false));
    }
  }, [tab, id]);

  useEffect(() => {
    if (tab === "offers") {
      setOffersLoading(true);
      setOffersError(null);
      AdminUserService.getUserOffers(id)
        .then((data) => setOffers(Array.isArray(data) ? data : []))
        .catch((e) =>
          setOffersError(e.message || "Ошибка загрузки предложений")
        )
        .finally(() => setOffersLoading(false));
    }
  }, [tab, id]);

  useEffect(() => {
    if (tab === "payments") {
      setPaymentsLoading(true);
      setPaymentsError(null);
      AdminUserService.getUserPayments(id)
        .then((data) => setPayments(Array.isArray(data) ? data : []))
        .catch((e) => setPaymentsError(e.message || "Ошибка загрузки платежей"))
        .finally(() => setPaymentsLoading(false));
    }
  }, [tab, id]);

  useEffect(() => {
    if (tab === "subscriptions") {
      setSubscriptionsLoading(true);
      setSubscriptionsError(null);
      AdminUserService.getUserSubscriptions(id)
        .then((data) => setSubscriptions(Array.isArray(data) ? data : []))
        .catch((e) =>
          setSubscriptionsError(e.message || "Ошибка загрузки подписок")
        )
        .finally(() => setSubscriptionsLoading(false));
    }
  }, [tab, id]);

  useEffect(() => {
    if (tab === "reviews") {
      setReviewsLoading(true);
      setReviewsError(null);
      AdminUserService.getUserReviews(id)
        .then((data) => setReviews(Array.isArray(data) ? data : []))
        .catch((e) => setReviewsError(e.message || "Ошибка загрузки отзывов"))
        .finally(() => setReviewsLoading(false));
    }
  }, [tab, id]);

  const handleApprove = async (paymentId) => {
    setActionLoading(paymentId);
    try {
      await PaymentService.updateStatus(paymentId, "paid");
      AdminUserService.getUserPayments(id).then((data) =>
        setPayments(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setPaymentsError(e.response?.data?.message || t("something_went_wrong"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirmDialog.payment) return;
    setActionLoading(confirmDialog.payment._id);
    try {
      await PaymentService.updateStatus(confirmDialog.payment._id, "failed");
      setConfirmDialog({ open: false, payment: null });
      AdminUserService.getUserPayments(id).then((data) =>
        setPayments(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setPaymentsError(e.response?.data?.message || t("something_went_wrong"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenStatusMenu = (event, request) => {
    setStatusMenuAnchor(event.currentTarget);
    setStatusMenuRequest(request);
  };

  const handleCloseStatusMenu = () => {
    setStatusMenuAnchor(null);
    setStatusMenuRequest(null);
  };

  const handleChangeRequestStatus = async (requestId, newStatus) => {
    try {
      await AdminUserService.updateRequestStatus(requestId, newStatus);
      AdminUserService.getUserRequests(id).then((data) =>
        setRequests(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setRequestsError(e.response?.data?.message || t("something_went_wrong"));
    } finally {
      handleCloseStatusMenu();
    }
  };

  const handleDeleteRequest = async () => {
    if (!deleteDialog.request) return;
    try {
      await AdminUserService.deleteRequest(deleteDialog.request._id);
      setDeleteDialog({ open: false, request: null });
      AdminUserService.getUserRequests(id).then((data) =>
        setRequests(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setRequestsError(e.response?.data?.message || t("something_went_wrong"));
    }
  };

  const handleOpenOfferStatusMenu = (event, offer) => {
    setOfferStatusMenuAnchor(event.currentTarget);
    setOfferStatusMenuOffer(offer);
  };

  const handleCloseOfferStatusMenu = () => {
    setOfferStatusMenuAnchor(null);
    setOfferStatusMenuOffer(null);
  };

  const getOfferType = (offer) => {
    if (offer && offer.type === "ServiceOffer") return "ServiceOffer";
    return "Offer";
  };

  const OFFER_STATUSES = {
    Offer: [
      { value: "pending", label: t("pending") || "На модерации" },
      { value: "accepted", label: t("accepted") || "Активно" },
      { value: "rejected", label: t("rejected") || "Отклонено" },
    ],
    ServiceOffer: [
      { value: "pending", label: t("pending") || "На модерации" },
      { value: "active", label: t("active") || "Активно" },
      { value: "inactive", label: t("inactive") || "Неактивно" },
    ],
  };

  const handleChangeOfferStatus = async (offerId, newStatus) => {
    const offer = offers.find((o) => o._id === offerId);
    const type = getOfferType(offer);
    try {
      await AdminUserService.updateOfferStatus(offerId, newStatus, type);
      AdminUserService.getUserOffers(id).then((data) =>
        setOffers(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setOffersError(e.response?.data?.message || t("something_went_wrong"));
    } finally {
      handleCloseOfferStatusMenu();
    }
  };

  const handleDeleteOffer = async () => {
    if (!deleteOfferDialog.offer) return;
    try {
      await AdminUserService.deleteOffer(deleteOfferDialog.offer._id);
      setDeleteOfferDialog({ open: false, offer: null });
      AdminUserService.getUserOffers(id).then((data) =>
        setOffers(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setOffersError(e.response?.data?.message || t("something_went_wrong"));
    }
  };

  const handleToggleTop = async (offer) => {
    setTopLoading(offer._id);
    try {
      await AdminUserService.toggleOfferTop(offer._id, !offer.isTop);
      AdminUserService.getUserOffers(id).then((data) =>
        setOffers(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setOffersError(e.response?.data?.message || t("something_went_wrong"));
    } finally {
      setTopLoading(null);
    }
  };

  const handleRefund = async () => {
    if (!refundDialog.payment) return;
    setRefundLoading(refundDialog.payment._id);
    try {
      await PaymentService.updateStatus(refundDialog.payment._id, "refunded");
      setRefundDialog({ open: false, payment: null });
      AdminUserService.getUserPayments(id).then((data) =>
        setPayments(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setPaymentsError(e.response?.data?.message || t("something_went_wrong"));
    } finally {
      setRefundLoading(null);
    }
  };

  const handleDeleteSubscription = async () => {
    if (!deleteSubscriptionDialog.subscription) return;
    try {
      await AdminUserService.deleteSubscription(
        deleteSubscriptionDialog.subscription._id
      );
      setDeleteSubscriptionDialog({ open: false, subscription: null });
      AdminUserService.getUserSubscriptions(id).then((data) =>
        setSubscriptions(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setSubscriptionsError(
        e.response?.data?.message || t("something_went_wrong")
      );
    }
  };

  const handleToggleSubscription = async (subscription) => {
    setToggleLoading(subscription._id);
    try {
      await AdminUserService.toggleSubscriptionActive(
        subscription._id,
        subscription.status !== "active"
      );
      AdminUserService.getUserSubscriptions(id).then((data) =>
        setSubscriptions(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setSubscriptionsError(
        e.response?.data?.message || t("something_went_wrong")
      );
    } finally {
      setToggleLoading(null);
    }
  };

  const handleRenewSubscription = async (period) => {
    if (!renewDialog.subscription) return;
    setRenewLoading(renewDialog.subscription._id);
    try {
      await AdminUserService.renewSubscription(
        renewDialog.subscription._id,
        period
      );
      setRenewDialog({ open: false, subscription: null });
      AdminUserService.getUserSubscriptions(id).then((data) =>
        setSubscriptions(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setSubscriptionsError(
        e.response?.data?.message || t("something_went_wrong")
      );
    } finally {
      setRenewLoading(null);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteReviewDialog.review) return;
    try {
      await AdminUserService.deleteReview(deleteReviewDialog.review._id);
      setDeleteReviewDialog({ open: false, review: null });
      AdminUserService.getUserReviews(id).then((data) =>
        setReviews(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setReviewsError(e.response?.data?.message || t("something_went_wrong"));
    }
  };

  const handleReviewStatus = async (review, status) => {
    setReviewActionLoading(review._id + status);
    try {
      await AdminUserService.updateReviewStatus(review._id, status);
      AdminUserService.getUserReviews(id).then((data) =>
        setReviews(Array.isArray(data) ? data : [])
      );
    } catch (e) {
      setReviewsError(e.response?.data?.message || t("something_went_wrong"));
    } finally {
      setReviewActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          ← Назад
        </Button>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          alignItems="center"
        >
          <Box>
            <Typography variant="h5">{user.name}</Typography>
            <Typography color="textSecondary">{user.email}</Typography>
            <Typography color="textSecondary">Роль: {user.role}</Typography>
            <Typography color="textSecondary">Статус: {user.status}</Typography>
            <Typography color="textSecondary">
              Дата регистрации: {new Date(user.createdAt).toLocaleDateString()}
            </Typography>
            <Typography color="textSecondary">
              Последний вход: {new Date(user.lastLogin).toLocaleString()}
            </Typography>
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", sm: "block" } }}
          />
          <Box>
            <Typography>Заявок: {summary.requests}</Typography>
            <Typography>Предложений: {summary.offers}</Typography>
            <Typography>Платежей: {summary.payments}</Typography>
            <Typography>Подписок: {summary.subscriptions}</Typography>
            <Typography>Отзывы: {summary.reviews}</Typography>
          </Box>
          <Box>
            <Button variant="contained" color="error" sx={{ mr: 1 }}>
              Заблокировать
            </Button>
            <Button variant="outlined" color="primary" sx={{ mr: 1 }}>
              Сменить роль
            </Button>
            <Button variant="outlined" color="secondary">
              Сбросить пароль
            </Button>
          </Box>
        </Stack>
      </Paper>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {TABS.map((t) => (
          <Tab key={t.value} label={t.label} value={t.value} />
        ))}
      </Tabs>
      <Paper sx={{ p: 3 }}>
        {tab === "requests" &&
          (requestsLoading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          ) : requestsError ? (
            <Alert severity="error">{requestsError}</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Описание</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(requests) &&
                  requests.map((req) => (
                    <TableRow key={req._id}>
                      <TableCell>
                        {new Date(req.createdAt).toLocaleString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => handleOpenStatusMenu(e, req)}
                        >
                          {req.status}
                        </Button>
                      </TableCell>
                      <TableCell>{req.description}</TableCell>
                      <TableCell>
                        <Tooltip title={t("open_request") || "Открыть заявку"}>
                          <IconButton
                            size="small"
                            component="a"
                            href={`/requests/${req._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LaunchIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={t("delete_request") || "Удалить заявку"}
                        >
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteDialog({ open: true, request: req })
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ))}
        {tab === "offers" &&
          (offersLoading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          ) : offersError ? (
            <Alert severity="error">{offersError}</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Название</TableCell>
                  <TableCell>Цена</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(offers) &&
                  offers.map((offer) => (
                    <TableRow key={offer._id}>
                      <TableCell>
                        {new Date(offer.createdAt).toLocaleString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => handleOpenOfferStatusMenu(e, offer)}
                        >
                          {offer.status}
                        </Button>
                      </TableCell>
                      <TableCell>{offer.title}</TableCell>
                      <TableCell>{offer.price}</TableCell>
                      <TableCell>
                        <Tooltip
                          title={
                            offer.isTop
                              ? t("remove_from_top")
                              : t("add_to_top") || "ТОП"
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              color={offer.isTop ? "warning" : "default"}
                              disabled={topLoading === offer._id}
                              onClick={() => handleToggleTop(offer)}
                            >
                              {topLoading === offer._id ? (
                                <CircularProgress size={20} />
                              ) : offer.isTop ? (
                                <StarIcon />
                              ) : (
                                <StarBorderIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={t("open_offer") || "Открыть предложение"}
                        >
                          <IconButton
                            size="small"
                            component="a"
                            href={`/offers/${offer._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LaunchIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={t("delete_offer") || "Удалить предложение"}
                        >
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteOfferDialog({ open: true, offer })
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ))}
        {tab === "payments" &&
          (paymentsLoading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          ) : paymentsError ? (
            <Alert severity="error">{paymentsError}</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Сумма</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Тариф</TableCell>
                  <TableCell>Связь</TableCell>
                  <TableCell>Транзакция</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(payments) &&
                  payments.map((pay) => (
                    <TableRow key={pay._id}>
                      <TableCell>
                        {new Date(pay.createdAt).toLocaleString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pay.status}
                          color={
                            pay.status === "pending"
                              ? "warning"
                              : pay.status === "paid"
                              ? "success"
                              : pay.status === "failed"
                              ? "error"
                              : pay.status === "refunded"
                              ? "default"
                              : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{pay.amount}</TableCell>
                      <TableCell>{pay.type}</TableCell>
                      <TableCell>{pay.tariffId?.name || "-"}</TableCell>
                      <TableCell>
                        {pay.offerId && (
                          <Tooltip
                            title={t("open_offer") || "Открыть предложение"}
                          >
                            <IconButton
                              size="small"
                              component="a"
                              href={`/offers/${pay.offerId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <LaunchIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {pay.subscriptionId && (
                          <Tooltip
                            title={t("open_subscription") || "Открыть подписку"}
                          >
                            <IconButton
                              size="small"
                              component="a"
                              href={`/subscriptions/${pay.subscriptionId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <LaunchIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        {pay.transactionId ? (
                          <Tooltip
                            title={
                              t("open_transaction") || "Открыть транзакцию"
                            }
                          >
                            <a
                              href={`https://payment-gateway.com/tx/${pay.transactionId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ textDecoration: "underline" }}
                            >
                              {pay.transactionId.slice(0, 8)}...
                            </a>
                          </Tooltip>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {pay.status === "pending" ? (
                          <>
                            <Tooltip
                              title={t("approve_payment") || "Подтвердить"}
                            >
                              <span>
                                <IconButton
                                  color="success"
                                  size="small"
                                  disabled={!!actionLoading}
                                  onClick={() => handleApprove(pay._id)}
                                >
                                  {actionLoading === pay._id ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <CheckIcon />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={t("cancel_payment") || "Отклонить"}>
                              <span>
                                <IconButton
                                  color="error"
                                  size="small"
                                  disabled={!!actionLoading}
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      payment: pay,
                                    })
                                  }
                                >
                                  <CloseIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        ) : null}
                        {pay.status === "paid" && (
                          <Tooltip
                            title={t("refund_payment") || "Вернуть средства"}
                          >
                            <span>
                              <IconButton
                                color="primary"
                                size="small"
                                disabled={!!refundLoading}
                                onClick={() =>
                                  setRefundDialog({ open: true, payment: pay })
                                }
                              >
                                {refundLoading === pay._id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <ReplayIcon />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ))}
        {tab === "subscriptions" &&
          (subscriptionsLoading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          ) : subscriptionsError ? (
            <Alert severity="error">{subscriptionsError}</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Тариф</TableCell>
                  <TableCell>Период</TableCell>
                  <TableCell>Дата начала</TableCell>
                  <TableCell>Дата окончания</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Платеж</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(subscriptions) &&
                  subscriptions.map((sub) => (
                    <TableRow key={sub._id}>
                      <TableCell>{sub.tariffId?.name || "-"}</TableCell>
                      <TableCell>
                        {sub.tariffId?.period
                          ? t("days", { count: sub.tariffId.period })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(sub.startDate).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        {new Date(sub.endDate).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell>{sub.status}</TableCell>
                      <TableCell>
                        {sub.lastPaymentId && (
                          <Tooltip
                            title={t("open_payment") || "Открыть платеж"}
                          >
                            <IconButton
                              size="small"
                              component="a"
                              href={`/payments/${sub.lastPaymentId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <LinkIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={t("open_subscription") || "Открыть подписку"}
                        >
                          <IconButton
                            size="small"
                            component="a"
                            href={`/subscriptions/${sub._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LaunchIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            sub.status === "active"
                              ? t("deactivate_subscription")
                              : t("activate_subscription") ||
                                "Активировать/Деактивировать"
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              color={
                                sub.status === "active" ? "success" : "default"
                              }
                              disabled={toggleLoading === sub._id}
                              onClick={() => handleToggleSubscription(sub)}
                            >
                              {toggleLoading === sub._id ? (
                                <CircularProgress size={20} />
                              ) : sub.status === "active" ? (
                                <ToggleOnIcon />
                              ) : (
                                <ToggleOffIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={t("renew_subscription") || "Продлить подписку"}
                        >
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={renewLoading === sub._id}
                              onClick={() =>
                                setRenewDialog({
                                  open: true,
                                  subscription: sub,
                                })
                              }
                            >
                              <AutorenewIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={t("delete_subscription") || "Удалить подписку"}
                        >
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteSubscriptionDialog({
                                open: true,
                                subscription: sub,
                              })
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ))}
        {tab === "reviews" &&
          (reviewsLoading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          ) : reviewsError ? (
            <Alert severity="error">{reviewsError}</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Автор</TableCell>
                  <TableCell>Рейтинг</TableCell>
                  <TableCell>Текст</TableCell>
                  <TableCell>Связь</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(reviews) &&
                  reviews.map((rev) => (
                    <TableRow key={rev._id}>
                      <TableCell>
                        {new Date(rev.createdAt).toLocaleString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={
                            t("open_user_profile") || "Профиль пользователя"
                          }
                        >
                          <IconButton
                            size="small"
                            component="a"
                            href={`/admin/users/${rev.author?._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <PersonIcon />
                          </IconButton>
                        </Tooltip>
                        {rev.author?.name || "-"}
                      </TableCell>
                      <TableCell>{rev.rating}</TableCell>
                      <TableCell>{rev.text}</TableCell>
                      <TableCell>
                        {rev.offerId && (
                          <Tooltip
                            title={t("open_offer") || "Открыть предложение"}
                          >
                            <IconButton
                              size="small"
                              component="a"
                              href={`/offers/${rev.offerId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <LaunchIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {rev.requestId && (
                          <Tooltip
                            title={t("open_request") || "Открыть заявку"}
                          >
                            <IconButton
                              size="small"
                              component="a"
                              href={`/requests/${rev.requestId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <LaunchIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        {rev.status === "pending" && (
                          <>
                            <Tooltip
                              title={t("approve_review") || "Одобрить отзыв"}
                            >
                              <span>
                                <IconButton
                                  color="success"
                                  size="small"
                                  disabled={
                                    reviewActionLoading === rev._id + "approved"
                                  }
                                  onClick={() =>
                                    handleReviewStatus(rev, "approved")
                                  }
                                >
                                  {reviewActionLoading ===
                                  rev._id + "approved" ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <ThumbUpIcon />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip
                              title={t("reject_review") || "Отклонить отзыв"}
                            >
                              <span>
                                <IconButton
                                  color="error"
                                  size="small"
                                  disabled={
                                    reviewActionLoading === rev._id + "rejected"
                                  }
                                  onClick={() =>
                                    handleReviewStatus(rev, "rejected")
                                  }
                                >
                                  {reviewActionLoading ===
                                  rev._id + "rejected" ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <ThumbDownIcon />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title={t("delete_review") || "Удалить отзыв"}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteReviewDialog({ open: true, review: rev })
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ))}
      </Paper>
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleCloseStatusMenu}
      >
        {["pending", "approved", "in_progress", "completed", "rejected"].map(
          (status) => (
            <MenuItem
              key={status}
              selected={statusMenuRequest?.status === status}
              onClick={() =>
                handleChangeRequestStatus(statusMenuRequest._id, status)
              }
            >
              {t(status)}
            </MenuItem>
          )
        )}
      </Menu>
      <Menu
        anchorEl={offerStatusMenuAnchor}
        open={Boolean(offerStatusMenuAnchor)}
        onClose={handleCloseOfferStatusMenu}
      >
        {offerStatusMenuOffer &&
          (
            OFFER_STATUSES[getOfferType(offerStatusMenuOffer)] ||
            OFFER_STATUSES["Offer"]
          ).map((status) => (
            <MenuItem
              key={status.value}
              selected={offerStatusMenuOffer.status === status.value}
              onClick={() =>
                handleChangeOfferStatus(offerStatusMenuOffer._id, status.value)
              }
            >
              {status.label}
            </MenuItem>
          ))}
      </Menu>
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, payment: null })}
      >
        <DialogTitle>{t("confirm_cancel_payment_title")}</DialogTitle>
        <DialogContent>{t("confirm_cancel_payment_text")}</DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false, payment: null })}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleCancel}
            color="error"
            variant="contained"
            disabled={!!actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : t("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, request: null })}
      >
        <DialogTitle>{t("confirm_delete_request")}</DialogTitle>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, request: null })}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDeleteRequest}
            color="error"
            variant="contained"
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={deleteOfferDialog.open}
        onClose={() => setDeleteOfferDialog({ open: false, offer: null })}
      >
        <DialogTitle>{t("confirm_delete_offer")}</DialogTitle>
        <DialogActions>
          <Button
            onClick={() => setDeleteOfferDialog({ open: false, offer: null })}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleDeleteOffer} color="error" variant="contained">
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={refundDialog.open}
        onClose={() => setRefundDialog({ open: false, payment: null })}
      >
        <DialogTitle>{t("confirm_refund_payment_title")}</DialogTitle>
        <DialogContent>{t("confirm_refund_payment_text")}</DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRefundDialog({ open: false, payment: null })}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleRefund}
            color="primary"
            variant="contained"
            disabled={!!refundLoading}
          >
            {refundLoading ? <CircularProgress size={20} /> : t("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={deleteSubscriptionDialog.open}
        onClose={() =>
          setDeleteSubscriptionDialog({ open: false, subscription: null })
        }
      >
        <DialogTitle>{t("confirm_delete_subscription")}</DialogTitle>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteSubscriptionDialog({ open: false, subscription: null })
            }
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDeleteSubscription}
            color="error"
            variant="contained"
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={renewDialog.open}
        onClose={() => setRenewDialog({ open: false, subscription: null })}
      >
        <DialogTitle>{t("renew_subscription")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("select_renew_period") || "Выберите период продления (в днях):"}
          </Typography>
          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant="outlined"
                onClick={() => handleRenewSubscription(days)}
                disabled={
                  renewLoading ===
                  (renewDialog.subscription && renewDialog.subscription._id)
                }
              >
                {t("days", { count: days })}
              </Button>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleteReviewDialog.open}
        onClose={() => setDeleteReviewDialog({ open: false, review: null })}
      >
        <DialogTitle>{t("confirm_delete_review")}</DialogTitle>
        <DialogActions>
          <Button
            onClick={() => setDeleteReviewDialog({ open: false, review: null })}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleDeleteReview}
            color="error"
            variant="contained"
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUserProfilePage;
