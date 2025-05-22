import api from "../config/api";

class PaymentGatewayService {
  static async initiate(payment) {
    const response = await api.post("/payments/gateway/initiate", payment);
    return response.data;
  }

  static async verify(paymentId) {
    const response = await api.post(`/payments/gateway/verify/${paymentId}`);
    return response.data;
  }

  static async cancel(paymentId) {
    const response = await api.post(`/payments/gateway/cancel/${paymentId}`);
    return response.data;
  }
}

export default PaymentGatewayService;
