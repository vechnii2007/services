import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@mui/material";

// Тестовый publishable key Stripe (замените на свой для production)
const stripePromise = loadStripe("pk_test_51N...your_test_key...");

const StripeCheckoutButton = ({ amount, description }) => {
  const handleClick = async () => {
    const stripe = await stripePromise;
    // ВАЖНО: для production нельзя использовать secret key на фронте!
    // Для MVP/теста — временно можно, но Stripe это не рекомендует.
    const response = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer sk_test_51N...your_secret_key...", // временно, только для теста!
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          payment_method_types: "card,google_pay,apple_pay",
          line_items: JSON.stringify([
            {
              price_data: {
                currency: "eur",
                product_data: { name: description },
                unit_amount: amount * 100,
              },
              quantity: 1,
            },
          ]),
          mode: "payment",
          success_url: window.location.origin + "/success",
          cancel_url: window.location.origin + "/cancel",
        }),
      }
    );
    const session = await response.json();
    await stripe.redirectToCheckout({ sessionId: session.id });
  };

  return (
    <Button variant="contained" color="primary" onClick={handleClick} fullWidth>
      Оплатить через Stripe (Google Pay / Apple Pay)
    </Button>
  );
};

export default StripeCheckoutButton;
