import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../utils/axiosConfig';
import { Box, Typography, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const PaymentDashboard = () => {
    const { t } = useTranslation();
    const [payments, setPayments] = useState([]);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const res = await axios.get('/users/payments');
                setPayments(res.data);
                setMessage(t('payments_loaded'));
            } catch (error) {
                setMessage('Error: ' + (error.response?.data?.error || t('something_went_wrong')));
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, [t]);

    const handleDeposit = async () => {
        if (!amount || amount <= 0) {
            setMessage(t('invalid_amount'));
            return;
        }

        try {
            const res = await axios.post('/users/payments/deposit', { amount: parseFloat(amount) });
            setPayments([res.data, ...payments]);
            setAmount('');
            setMessage(t('deposit_successful'));
        } catch (error) {
            setMessage('Error: ' + (error.response?.data?.error || t('something_went_wrong')));
        }
    };

    if (loading) {
        return <Typography>{t('loading')}</Typography>;
    }

    return (
        <Box sx={{ paddingY: 4 }}>
            <Typography variant="h4" gutterBottom>
                {t('payment_dashboard')}
            </Typography>
            {message && (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ marginBottom: 2 }}>
                    {message}
                </Typography>
            )}

            {/* Форма для пополнения баланса */}
            <Box sx={{ maxWidth: 400, margin: '0 auto', mb: 4 }}>
                <TextField
                    label={t('amount')}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    fullWidth
                    margin="normal"
                />
                <Button variant="contained" color="primary" onClick={handleDeposit} sx={{ mt: 2 }}>
                    {t('deposit')}
                </Button>
            </Box>

            {/* История платежей */}
            <Typography variant="h6" gutterBottom>
                {t('payment_history')}
            </Typography>
            {payments.length > 0 ? (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('date')}</TableCell>
                            <TableCell>{t('type')}</TableCell>
                            <TableCell>{t('amount')}</TableCell>
                            <TableCell>{t('status')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payments.map((payment) => (
                            <TableRow key={payment._id}>
                                <TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell>
                                <TableCell>{t(payment.type)}</TableCell>
                                <TableCell>{payment.amount} {t('currency')}</TableCell>
                                <TableCell>{t(payment.status)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <Typography variant="body1" align="center">
                    {t('no_payments')}
                </Typography>
            )}
        </Box>
    );
};

export default PaymentDashboard;